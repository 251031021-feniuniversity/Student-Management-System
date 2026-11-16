<?php
/* TeacherController */
class TeacherController
{
    public static function teacher_add($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        $tid = v($in, 'tid', 50); $name = v($in, 'name', 150); $email = v($in, 'email', 150); $pw = (string)($in['password'] ?? '');
        if (!idOk($tid)) fail('Teacher ID: 2-50 chars, only letters, numbers, . _ -');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Valid name and email required');
        if (!pwOk($pw)) fail('Password must be at least 6 characters');
        if (q('SELECT 1 FROM users WHERE uid=?', [$tid])) fail('Teacher ID already exists!');
        ex("INSERT INTO users (uid,password,role,name,email,subject,mobile,can_result,can_att,can_notice) VALUES (?,?,'teacher',?,?,?,?,?,?,?)",
           [$tid, password_hash($pw, PASSWORD_DEFAULT), $name, $email, v($in, 'subject', 100), v($in, 'mobile', 30),
            empty($in['can_result']) ? 0 : 1, empty($in['can_att']) ? 0 : 1, empty($in['can_notice']) ? 0 : 1]);
        out(['ok' => true]);
    }

    public static function teacher_update($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        $name = v($in, 'name', 150); $email = v($in, 'email', 150);
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Valid name and email required');
        ex("UPDATE users SET name=?,email=?,subject=?,mobile=? WHERE uid=? AND role='teacher'", [$name, $email, v($in, 'subject', 100), v($in, 'mobile', 30), v($in, 'tid', 50)]);
        out(['ok' => true]);
    }

    public static function teacher_pw($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        $pw = (string)($in['pw'] ?? ''); if (!pwOk($pw)) fail('Password must be at least 6 characters');
        ex("UPDATE users SET password=? WHERE uid=? AND role='teacher'", [password_hash($pw, PASSWORD_DEFAULT), v($in, 'tid', 50)]);
        out(['ok' => true]);
    }

    public static function teacher_access($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        ex("UPDATE users SET can_result=?,can_att=?,can_notice=? WHERE uid=? AND role='teacher'",
           [empty($in['can_result']) ? 0 : 1, empty($in['can_att']) ? 0 : 1, empty($in['can_notice']) ? 0 : 1, v($in, 'tid', 50)]);
        out(['ok' => true]);
    }

    public static function teacher_delete($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        ex("DELETE FROM users WHERE uid=? AND role='teacher'", [v($in, 'tid', 50)]);
        out(['ok' => true]);
    }

}
