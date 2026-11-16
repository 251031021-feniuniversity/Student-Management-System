<?php
/* BkashController — student pays a fee via bKash (step 1: create payment) */
class BkashController
{
    public static function bkash_create($u, $in): void
    {
        if ($u['role'] !== 'student') fail('Only students can pay fees online', 403);
        throttle('bkash', 20, 600);
        $id = (int)($in['id'] ?? 0);
        $f = q('SELECT id,amount,paid FROM fees WHERE id=? AND sid=?', [$id, $u['uid']])[0] ?? null;
        if (!$f) fail('Fee not found', 404);
        $due = (int)$f['amount'] - (int)$f['paid'];
        if ($due < 1) fail('This fee is already paid');

        $n = preg_replace('/\D/', '', (string)($in['number'] ?? ''));                // accept 01XXXXXXXXX or +8801XXXXXXXXX
        if (strpos($n, '880') === 0) $n = '0' . substr($n, 3);
        if (!preg_match('/^01[3-9]\d{8}$/', $n)) fail('Enter a valid bKash number (e.g. 01712345678)');

        try {
            $token = bkash_token();
            $r = bkash_call('/tokenized/checkout/create', [
                'mode' => '0011', 'payerReference' => $n, 'callbackURL' => bkash_callback_url(),
                'amount' => number_format($due, 2, '.', ''), 'currency' => 'BDT', 'intent' => 'sale',
                'merchantInvoiceNumber' => 'FEE' . $id . '-' . time(),
            ], $token);
        } catch (RuntimeException $e) {
            fail($e->getMessage(), 400);                                   // show the real reason instead of a generic "Server error"
        }
        if (($r['statusCode'] ?? '') !== '0000' || empty($r['bkashURL']) || empty($r['paymentID'])) {
            error_log('EduTrack bKash create failed: ' . substr(json_encode($r), 0, 300));
            fail('bKash error: ' . ($r['statusMessage'] ?? $r['errorMessage'] ?? $r['message'] ?? 'could not start payment') . ' [callback: ' . bkash_callback_url() . ']', 400);
        }

        ex('INSERT INTO bkash_payments (payment_id,fee_id,sid,amount,payer) VALUES (?,?,?,?,?)', [$r['paymentID'], $id, $u['uid'], $due, $n]);
        out(['ok' => true, 'url' => $r['bkashURL']]);
    }
}
