<?php
/* DataController */
class DataController
{
    public static function bootstrap($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        $stR = $staff ? q('SELECT * FROM students ORDER BY n') : q('SELECT * FROM students WHERE sid=?', [$u['uid']]);
        $students = array_map(fn($r) => ['sid' => $r['sid'], 'name' => $r['name'], 'email' => $r['email'], 'class' => $r['class_name'], 'batch' => $r['batch'],
            'mobile' => $r['mobile'], 'address' => $r['address'], 'dob' => $r['dob'], 'img' => $r['img'], 'joined' => $r['joined']], $stR);
        $rsR = $staff ? q('SELECT * FROM results ORDER BY id') : q('SELECT * FROM results WHERE sid=? ORDER BY id', [$u['uid']]);
        $results = array_map(fn($r) => ['id' => (string)$r['id'], 'sid' => $r['sid'], 'subject' => $r['subject'], 'exam' => $r['exam'],
            'marks' => (int)$r['marks'], 'total' => (int)$r['total'], 'date' => $r['exam_date'], 'addedBy' => $r['added_by']], $rsR);
        $atR = $staff ? q('SELECT * FROM attendance ORDER BY att_date, id') : q('SELECT * FROM attendance WHERE sid=? ORDER BY att_date', [$u['uid']]);
        $att = array_map(fn($r) => ['sid' => $r['sid'], 'date' => $r['att_date'], 'status' => $r['status'], 'markedBy' => $r['marked_by']], $atR);
        $nt = array_map(fn($r) => ['id' => (string)$r['id'], 'title' => $r['title'], 'body' => $r['body'], 'priority' => $r['priority'],
            'date' => date('d/m/Y H:i', strtotime($r['created_at'])), 'by' => $r['by_name']], q('SELECT * FROM notices ORDER BY id'));
        $users = [];
        if ($staff) {
            foreach (q("SELECT uid,role,name,email,subject,mobile,can_result,can_att,can_notice FROM users WHERE role<>'student' ORDER BY created_at, uid") as $r) {
                if (!$admin && $r['uid'] !== $u['uid']) $r = ['uid' => $r['uid'], 'role' => $r['role'], 'name' => $r['name']];
                else foreach (['can_result', 'can_att', 'can_notice'] as $k) $r[$k] = (bool)$r[$k];
                $users[] = $r;
            }
        }
        $reqs = [];
        if ($admin) {
            $reqs = array_map(fn($r) => ['id' => (string)$r['id'], 'name' => $r['name'], 'email' => $r['email'], 'mobile' => $r['mobile'],
                'class' => $r['class_name'], 'batch' => $r['batch'], 'address' => $r['address'], 'date' => date('d/m/Y H:i', strtotime($r['created_at']))], q('SELECT * FROM registrations ORDER BY id'));
        }
        $sel = "SELECT f.*, (SELECT b.payment_id FROM bkash_payments b WHERE b.fee_id=f.id AND b.status='completed' ORDER BY b.id DESC LIMIT 1) AS pid FROM fees f";
        $feR = $staff ? q($sel . ' ORDER BY f.id') : q($sel . ' WHERE f.sid=? ORDER BY f.id', [$u['uid']]);
        $fees = array_map(fn($r) => ['id' => (string)$r['id'], 'sid' => $r['sid'], 'title' => $r['title'], 'amount' => (int)$r['amount'],
            'paid' => (int)$r['paid'], 'due' => $r['due_date'], 'paidDate' => $r['paid_date'], 'pid' => $r['pid']], $role === 'teacher' ? [] : $feR);   // teachers don't see fees
        $me = $u; foreach (['can_result', 'can_att', 'can_notice'] as $k) $me[$k] = (bool)$me[$k];
        $defPw = false;
        if ($admin) { $h = q("SELECT password FROM users WHERE uid=?", [$u['uid']])[0]['password'] ?? ''; $defPw = password_verify('admin123', $h); }
        out(['ok' => true, 'user' => $me, 'users' => $users, 'students' => $students, 'results' => $results, 'attendance' => $att,
             'notices' => $nt, 'cfg' => cfg(), 'defaultPw' => $defPw, 'requests' => $reqs, 'fees' => $fees]);
    }

}
