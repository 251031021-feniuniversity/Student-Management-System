<?php
/* InvoiceController — invoice for a completed bKash payment (owner student or admin) */
class InvoiceController
{
    public static function invoice_get($u, $in): void
    {
        if ($u['role'] === 'teacher') fail('Forbidden', 403);
        $pid = v($in, 'pid', 60);
        $r = q("SELECT b.id AS bid, b.payment_id, b.amount AS pay_amt, b.trx_id, b.payer, b.created_at, b.sid,
                       f.title, f.amount AS fee_amount, f.paid AS fee_paid,
                       s.name, s.email, s.class_name, s.batch, s.mobile, s.address, s.dob, s.joined
                FROM bkash_payments b
                JOIN fees f ON f.id = b.fee_id
                JOIN students s ON s.sid = b.sid
                WHERE b.payment_id = ? AND b.status = 'completed'", [$pid])[0] ?? null;
        if (!$r) fail('Invoice not found', 404);
        if ($u['role'] === 'student' && $r['sid'] !== $u['uid']) fail('Forbidden', 403);
        $c = cfg();
        out(['ok' => true, 'invoice' => [
            'no' => 'INV-' . str_pad((string)$r['bid'], 6, '0', STR_PAD_LEFT),
            'date' => date('d M Y, h:i A', strtotime($r['created_at'])),
            'trx' => $r['trx_id'], 'payer' => $r['payer'], 'method' => 'bKash', 'status' => 'PAID',
            'payAmount' => (int)$r['pay_amt'], 'feeTitle' => $r['title'],
            'feeAmount' => (int)$r['fee_amount'], 'feePaid' => (int)$r['fee_paid'],
            'school' => $c['appFull'], 'tagline' => $c['tagline'],
            'student' => ['sid' => $r['sid'], 'name' => $r['name'], 'email' => $r['email'], 'class' => $r['class_name'], 'batch' => $r['batch'],
                          'mobile' => $r['mobile'], 'address' => $r['address'], 'dob' => $r['dob'], 'joined' => $r['joined']],
        ]]);
    }
}
