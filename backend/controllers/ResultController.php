<?php
/* ResultController */
class ResultController
{
    public static function result_add($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!can($u, 'can_result')) fail('No result permission', 403);
        $sid = v($in, 'sid', 50); $marks = (int)($in['marks'] ?? -1); $total = (int)($in['total'] ?? 0);
        $subject = v($in, 'subject', 120); $exam = v($in, 'exam', 120);
        if ($subject === '' || $exam === '') fail('Subject and exam required');
        if ($total < 1 || $total > 1000 || $marks < 0 || $marks > $total) fail('Marks must be between 0 and total');
        if (!q('SELECT 1 FROM students WHERE sid=?', [$sid])) fail('Student not found');
        ex('INSERT INTO results (sid,subject,exam,marks,total,exam_date,added_by) VALUES (?,?,?,?,?,CURDATE(),?)', [$sid, $subject, $exam, $marks, $total, $u['uid']]);
        out(['ok' => true]);
    }

    public static function result_delete($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!can($u, 'can_result')) fail('No result permission', 403);
        if ($admin) ex('DELETE FROM results WHERE id=?', [(int)($in['id'] ?? 0)]);
        else ex('DELETE FROM results WHERE id=? AND added_by=?', [(int)($in['id'] ?? 0), $u['uid']]);
        out(['ok' => true]);
    }

}
