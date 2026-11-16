<?php
/* AttendanceController */
class AttendanceController
{
    public static function att_save($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!can($u, 'can_att')) fail('No attendance permission', 403);
        $date = v($in, 'date', 10); if (!dateOk($date)) fail('Invalid date');
        $recs = is_array($in['records'] ?? null) ? $in['records'] : [];
        $valid = array_column(q('SELECT sid FROM students'), 'sid', 'sid');
        $n = 0;
        $pdo->beginTransaction();
        $st = $pdo->prepare('INSERT INTO attendance (sid,att_date,status,marked_by) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status), marked_by=VALUES(marked_by)');
        foreach ($recs as $r) {
            $sid = (string)($r['sid'] ?? ''); $status = $r['status'] ?? '';
            if (isset($valid[$sid]) && in_array($status, ['present', 'absent'], true)) { $st->execute([$sid, $date, $status, $u['name']]); $n++; }
        }
        $pdo->commit(); out(['ok' => true, 'count' => $n]);
    }

}
