<?php
/* StudentController */
class StudentController
{
    public static function student_add($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        $sid = v($in, 'sid', 50); $name = v($in, 'name', 150); $email = v($in, 'email', 150); $pw = (string)($in['password'] ?? '');
        $img = v($in, 'img', 500); $dob = v($in, 'dob', 10);
        if (!idOk($sid)) fail('Student ID: 2-50 chars, only letters, numbers, . _ -');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Valid name and email required');
        if (!pwOk($pw)) fail('Password must be at least 6 characters');
        if (!imgOk($img)) fail('Photo URL must start with http:// or https://');
        if ($dob !== '' && !dateOk($dob)) fail('Invalid date of birth');
        if (q('SELECT 1 FROM users WHERE uid=?', [$sid])) fail('ID already in use!');
        $pdo->beginTransaction();
        ex("INSERT INTO users (uid,password,role,name,email) VALUES (?,?,'student',?,?)", [$sid, password_hash($pw, PASSWORD_DEFAULT), $name, $email]);
        ex('INSERT INTO students (sid,name,email,class_name,batch,mobile,address,dob,img,joined) VALUES (?,?,?,?,?,?,?,?,?,CURDATE())',
           [$sid, $name, $email, v($in, 'class', 100), v($in, 'batch', 30), v($in, 'mobile', 30), v($in, 'address', 1000), $dob ?: null, $img ?: null]);
        $pdo->commit(); out(['ok' => true]);
    }

    public static function student_update($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        $sid = v($in, 'sid', 50); $name = v($in, 'name', 150); $email = v($in, 'email', 150); $img = v($in, 'img', 500); $dob = v($in, 'dob', 10);
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Valid name and email required');
        if (!imgOk($img)) fail('Photo URL must start with http:// or https://');
        if ($dob !== '' && !dateOk($dob)) fail('Invalid date of birth');
        $pdo->beginTransaction();
        ex('UPDATE students SET name=?,email=?,class_name=?,batch=?,mobile=?,address=?,dob=?,img=? WHERE sid=?',
           [$name, $email, v($in, 'class', 100), v($in, 'batch', 30), v($in, 'mobile', 30), v($in, 'address', 1000), $dob ?: null, $img ?: null, $sid]);
        ex("UPDATE users SET name=?,email=? WHERE uid=? AND role='student'", [$name, $email, $sid]);
        $pdo->commit(); out(['ok' => true]);
    }

    public static function student_pw($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        $pw = (string)($in['pw'] ?? ''); if (!pwOk($pw)) fail('Password must be at least 6 characters');
        ex("UPDATE users SET password=? WHERE uid=? AND role='student'", [password_hash($pw, PASSWORD_DEFAULT), v($in, 'sid', 50)]);
        out(['ok' => true]);
    }

    public static function student_delete($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        $sid = v($in, 'sid', 50);
        $pdo->beginTransaction();
        ex('DELETE FROM students WHERE sid=?', [$sid]);
        ex("DELETE FROM users WHERE uid=? AND role='student'", [$sid]);
        $pdo->commit(); out(['ok' => true]);
    }

}
