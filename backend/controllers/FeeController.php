<?php
/* FeeController — admin only: add fee, record payment, delete */
class FeeController
{
    private static function adminOnly($u): void { if ($u['role'] !== 'admin') fail('Forbidden', 403); }

    public static function fee_add($u, $in): void
    {
        self::adminOnly($u);
        $title = v($in, 'title', 150); $amount = (int)($in['amount'] ?? 0); $due = v($in, 'due', 10);
        if ($title === '') fail('Fee title required');
        if ($amount < 1 || $amount > 10000000) fail('Invalid amount');
        if ($due !== '' && !dateOk($due)) fail('Invalid due date');
        $sids = [];
        if (v($in, 'sid', 50) === '__all__') $sids = array_column(q('SELECT sid FROM students'), 'sid');   // charge every student
        else { $sid = v($in, 'sid', 50); if (!q('SELECT 1 FROM students WHERE sid=?', [$sid])) fail('Student not found'); $sids[] = $sid; }
        if (!$sids) fail('No students to charge');
        foreach ($sids as $sid) ex('INSERT INTO fees (sid,title,amount,due_date) VALUES (?,?,?,?)', [$sid, $title, $amount, $due ?: null]);
        out(['ok' => true, 'count' => count($sids)]);
    }

    public static function fee_pay($u, $in): void
    {
        self::adminOnly($u);
        $id = (int)($in['id'] ?? 0); $pay = (int)($in['pay'] ?? 0);
        $f = q('SELECT amount,paid FROM fees WHERE id=?', [$id])[0] ?? null;
        if (!$f) fail('Fee not found', 404);
        $due = (int)$f['amount'] - (int)$f['paid'];
        if ($pay < 1 || $pay > $due) fail('Payment must be between 1 and ' . $due);
        ex('UPDATE fees SET paid=paid+?, paid_date=CURDATE() WHERE id=?', [$pay, $id]);
        out(['ok' => true]);
    }

    public static function fee_delete($u, $in): void
    {
        self::adminOnly($u);
        $id = (int)($in['id'] ?? 0);
        if (q("SELECT 1 FROM bkash_payments WHERE fee_id=? AND status IN ('completed','pending') LIMIT 1", [$id]))
            fail('This fee has a bKash payment (invoice) and cannot be deleted.');                  // deleting it would also erase the payment record
        ex('DELETE FROM fees WHERE id=?', [$id]);
        out(['ok' => true]);
    }
}
