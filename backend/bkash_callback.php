<?php
/* bKash redirects the customer here after payment:  ?paymentID=...&status=success|failure|cancel
   Verifies with bKash (execute), marks the fee paid, then sends the student to the invoice page. */
require __DIR__ . '/server/config.php';
require __DIR__ . '/server/helpers.php';
require __DIR__ . '/server/database.php';
require __DIR__ . '/server/bkash.php';

$front = implode('/', array_map('rawurlencode', explode('/', rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/\\')))) . '/frontend/';   // encode spaces in folder names
function go(string $url): void { header('Location: ' . $url); exit; }

$pid = (string)($_GET['paymentID'] ?? ''); $status = (string)($_GET['status'] ?? '');
function why(...$rs): string {                                         // first readable reason from bKash replies, safe to put in a URL
    foreach ($rs as $x) { if (!is_array($x)) continue;
        $m = $x['statusMessage'] ?? $x['errorMessage'] ?? $x['message'] ?? null;
        if ($m) return '&why=' . urlencode(substr(strip_tags((string)$m) . (isset($x['statusCode']) ? ' (' . $x['statusCode'] . ')' : ''), 0, 120)); }
    return ''; }
try {
    $p = q("SELECT * FROM bkash_payments WHERE payment_id=?", [$pid])[0] ?? null;
    if (!$p) go($front . 'app.html?pay=invalid');
    $payPage = $front . 'pay.html?fee=' . (int)$p['fee_id'];
    if ($p['status'] === 'completed') go($front . 'invoice.html?p=' . urlencode($pid));     // callback opened twice / page refreshed: already paid
    if ($p['status'] !== 'pending') go($payPage . '&r=failed');
    if ($status !== 'success') {
        ex("UPDATE bkash_payments SET status=? WHERE id=? AND status='pending'", [$status === 'cancel' ? 'cancelled' : 'failed', $p['id']]);
        go($payPage . '&r=' . ($status === 'cancel' ? 'cancel' : 'failed'));
    }
    $token = bkash_token();
    $okOf = fn(array $x): bool => ($x['statusCode'] ?? '') === '0000' && ($x['transactionStatus'] ?? '') === 'Completed' && (int)round((float)($x['amount'] ?? 0)) === (int)$p['amount'];
    $r = []; $s2 = []; $err = '';
    try { $r = bkash_call('/tokenized/checkout/execute', ['paymentID' => $pid], $token); }
    catch (Throwable $e) { $err = $e->getMessage(); error_log('EduTrack bKash execute: ' . $err); }
    $ok = $okOf($r);
    if (!$ok) {                                                           // execute failed / timed out / already executed: ask bKash what really happened
        try { $s2 = bkash_status($pid, $token); if ($okOf($s2)) { $r = $s2; $ok = true; } else error_log('EduTrack bKash status: ' . substr(json_encode($s2), 0, 300)); }
        catch (Throwable $e) { $err = $err ?: $e->getMessage(); error_log('EduTrack bKash status: ' . $e->getMessage()); }
    }
    if (!$ok) {
        $definite = isset($r['statusCode']) || isset($s2['statusCode']);            // bKash itself answered "not completed"
        if ($definite) ex("UPDATE bkash_payments SET status='failed' WHERE id=? AND status='pending'", [$p['id']]);   // if bKash was unreachable we keep it pending so a refresh can re-verify (money may have been taken)
        $w = why($r, $s2) ?: ($err ? '&why=' . urlencode(substr($err, 0, 120)) : '');
        if (!$w && is_array($r) && isset($r['amount'])) $w = '&why=' . urlencode('amount mismatch: bKash ' . $r['amount'] . ' vs fee ' . $p['amount']);
        go($payPage . '&r=failed' . $w);
    }

    $trx = substr((string)($r['trxID'] ?? ''), 0, 40);
    $msisdn = substr(preg_replace('/\D/', '', (string)($r['customerMsisdn'] ?? '')), 0, 20);          // wallet that actually paid
    $pdo = db(); $pdo->beginTransaction();
    $done = ex("UPDATE bkash_payments SET status='completed', trx_id=?, payer=COALESCE(NULLIF(?, ''), payer) WHERE id=? AND status='pending'", [$trx, $msisdn, $p['id']]);   // guards against double-credit on refresh
    if ($done) ex('UPDATE fees SET paid=LEAST(amount, paid+?), paid_date=CURDATE() WHERE id=?', [(int)$p['amount'], (int)$p['fee_id']]);
    $pdo->commit();
    go($front . 'invoice.html?p=' . urlencode($pid));
} catch (Throwable $e) {
    try { if (db()->inTransaction()) db()->rollBack(); } catch (Throwable $e2) {}
    error_log('EduTrack bKash: ' . $e->getMessage());
    go($front . 'app.html?pay=error&why=' . urlencode(substr($e->getMessage(), 0, 120)));
}
