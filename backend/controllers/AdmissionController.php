<?php
/* AdmissionController — public registration requests + admin approval */
class AdmissionController
{
    /* public */
    public static function register_submit($u, $in): void
    {
        throttle('reg', 5, 600);
        if (v($in, 'website', 100) !== '') out(['ok' => true]);          // honeypot
        $name = v($in, 'name', 150); $email = v($in, 'email', 150); $pw = (string)($in['password'] ?? '');
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Valid name and email required');
        if (!pwOk($pw)) fail('Password must be at least 6 characters');
        if (q('SELECT 1 FROM users WHERE email=?', [$email]) || q('SELECT 1 FROM registrations WHERE email=?', [$email]))
            fail('This email is already registered or pending approval.');
        ex('INSERT INTO registrations (name,email,mobile,class_name,batch,address,pw_hash) VALUES (?,?,?,?,?,?,?)',
           [$name, $email, v($in, 'mobile', 30), v($in, 'class', 100), v($in, 'batch', 30), v($in, 'address', 1000), password_hash($pw, PASSWORD_DEFAULT)]);
        out(['ok' => true]);
    }

    /* admin */
    public static function request_approve($u, $in): void
    {
        if ($u['role'] !== 'admin') fail('Forbidden', 403);
        $pdo = db();
        $sid = v($in, 'sid', 50);
        if (!idOk($sid)) fail('Student ID: 2-50 chars, only letters, numbers, . _ -');
        if (q('SELECT 1 FROM users WHERE uid=?', [$sid])) fail('ID already in use!');
        $r = q('SELECT * FROM registrations WHERE id=?', [(int)($in['id'] ?? 0)])[0] ?? null;
        if (!$r) fail('Request not found');
        $pdo->beginTransaction();
        ex("INSERT INTO users (uid,password,role,name,email) VALUES (?,?,'student',?,?)", [$sid, $r['pw_hash'], $r['name'], $r['email']]);
        ex('INSERT INTO students (sid,name,email,class_name,batch,mobile,address,joined) VALUES (?,?,?,?,?,?,?,CURDATE())',
           [$sid, $r['name'], $r['email'], $r['class_name'], $r['batch'], $r['mobile'], $r['address']]);
        ex('DELETE FROM registrations WHERE id=?', [$r['id']]);
        $pdo->commit();
        out(['ok' => true]);
    }

    public static function request_reject($u, $in): void
    {
        if ($u['role'] !== 'admin') fail('Forbidden', 403);
        ex('DELETE FROM registrations WHERE id=?', [(int)($in['id'] ?? 0)]);
        out(['ok' => true]);
    }
}
