<?php
/* SettingsController */
class SettingsController
{
    public static function cfg_save($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        $c = cfg();
        foreach (['appFull', 'appName', 'tagline'] as $k) if (isset($in[$k])) { $x = v($in, $k, 80); if ($x !== '' || $k === 'tagline') $c[$k] = $x; }
        if (isset($in['logoIcon']) && in_array($in['logoIcon'], ['fa-graduation-cap', 'fa-university', 'fa-school', 'fa-book-open', 'fa-atom', 'fa-mosque'], true)) $c['logoIcon'] = $in['logoIcon'];
        foreach (['primaryColor', 'accentColor'] as $k) if (isset($in[$k]) && preg_match('/^#[0-9a-fA-F]{6}$/', (string)$in[$k])) $c[$k] = $in[$k];
        foreach (['allowStudentPw', 'allowTeacherPw', 'showHint'] as $k) if (isset($in[$k])) $c[$k] = (bool)$in[$k];
        ex("INSERT INTO settings (k,v) VALUES ('cfg',?) ON DUPLICATE KEY UPDATE v=VALUES(v)", [json_encode($c, JSON_UNESCAPED_UNICODE)]);
        out(['ok' => true]);
    }

    public static function self_pw($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        $c = cfg();
        if ($role === 'student' && !$c['allowStudentPw']) fail('Password change disabled by admin', 403);
        if ($role === 'teacher' && !$c['allowTeacherPw']) fail('Password change disabled by admin', 403);
        $nw = (string)($in['nw'] ?? ''); if (!pwOk($nw)) fail('New password must be at least 6 characters');
        $h = q('SELECT password FROM users WHERE uid=?', [$u['uid']])[0]['password'] ?? '';
        if (!password_verify((string)($in['cur'] ?? ''), $h)) fail('Current password is wrong!');
        ex('UPDATE users SET password=? WHERE uid=?', [password_hash($nw, PASSWORD_DEFAULT), $u['uid']]);
        out(['ok' => true]);
    }

    public static function reset_system($u, $in): void
    {
        $pdo = db(); $role = $u['role']; $admin = $role === 'admin'; $staff = $admin || $role === 'teacher';
        if (!$admin) fail('Forbidden', 403);
        $h = q('SELECT password FROM users WHERE uid=?', [$u['uid']])[0]['password'] ?? '';
        if (!password_verify((string)($in['pw'] ?? ''), $h)) fail('Admin password is wrong!');
        $pdo->beginTransaction();
        foreach (['fees', 'attendance', 'results', 'notices', 'students'] as $t) $pdo->exec("DELETE FROM $t");
        $pdo->exec("DELETE FROM users WHERE role<>'admin'");
        $pdo->exec("DELETE FROM settings");
        $pdo->commit(); out(['ok' => true]);
    
    }

    /* public: session + CSRF token + public branding */
    public static function init($u, $in): void
    {
        out(['ok' => true, 'csrf' => $_SESSION['csrf'], 'cfg' => cfg()]);
    }

}
