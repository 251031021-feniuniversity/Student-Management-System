<?php
/* AuthController — login / logout */
class AuthController
{
    public static function login($u, $in): void
    {
        if (($_SESSION['lock'] ?? 0) > time()) fail('Too many attempts. Try again in a minute.', 429);
        $id = v($in, 'id', 150); $pw = (string)($in['pw'] ?? '');
        $r = q('SELECT * FROM users WHERE uid=? OR email=? ORDER BY (uid=?) DESC LIMIT 1', [$id, $id, $id])[0] ?? null;
        if (!$r || !password_verify($pw, $r['password'])) {
            $_SESSION['fails'] = ($_SESSION['fails'] ?? 0) + 1;
            if ($_SESSION['fails'] >= 5) { $_SESSION['lock'] = time() + 60; $_SESSION['fails'] = 0; }
            usleep(400000);
            fail('ভুল ID/Email বা Password। আবার চেষ্টা করুন।', 401);
        }
        session_regenerate_id(true);
        $_SESSION['uid'] = $r['uid']; $_SESSION['fails'] = 0;
        out(['ok' => true, 'role' => $r['role']]);
    }

    public static function logout($u, $in): void
    {
        $_SESSION = [];
        session_destroy();
        out(['ok' => true]);
    }
}
