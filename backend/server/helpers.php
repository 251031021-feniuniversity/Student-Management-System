<?php
/* Shared helper functions */
function out($a, int $c = 200) { http_response_code($c); header('Content-Type: application/json; charset=utf-8'); echo json_encode($a, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE); exit; }
function fail(string $m, int $c = 400) { out(['ok' => false, 'error' => $m], $c); }
function v(array $in, string $k, int $max = 255): string { return mb_substr(trim((string)($in[$k] ?? '')), 0, $max); }
function idOk(string $s): bool { return (bool)preg_match('/^[A-Za-z0-9._-]{2,50}$/', $s); }
function dateOk(string $s): bool { return (bool)preg_match('/^\d{4}-\d{2}-\d{2}$/', $s) && strtotime($s) !== false; }
function pwOk(string $p): bool { return strlen($p) >= 6 && strlen($p) <= 100; }
function imgOk(string $s): bool { return $s === '' || (bool)preg_match('~^https?://~i', $s); }
function can(array $u, string $perm): bool { return $u['role'] === 'admin' || ($u['role'] === 'teacher' && (int)$u[$perm] === 1); }

function q(string $sql, array $p = []): array { $s = db()->prepare($sql); $s->execute($p); return $s->fetchAll(); }
function ex(string $sql, array $p = []): int { $s = db()->prepare($sql); $s->execute($p); return $s->rowCount(); }

/* simple per-session rate limit for public forms */
function throttle(string $key, int $max, int $window): void
{
    $now = time();
    $hits = array_values(array_filter($_SESSION['thr'][$key] ?? [], fn($t) => $t > $now - $window));
    if (count($hits) >= $max) fail('Too many requests. Please try again later.', 429);
    $hits[] = $now;
    $_SESSION['thr'][$key] = $hits;
}

function defaults(): array
{
    return ['appName' => 'EduTrack', 'appFull' => 'EduTrack Pro', 'tagline' => 'Student Management System', 'logoIcon' => 'fa-graduation-cap',
            'primaryColor' => '#5b6ef5', 'accentColor' => '#a78bfa', 'allowStudentPw' => true, 'allowTeacherPw' => true, 'showHint' => false];
}
function cfg(): array
{
    $r = db()->query("SELECT v FROM settings WHERE k='cfg'")->fetchColumn();
    return array_merge(defaults(), $r ? (json_decode($r, true) ?: []) : []);
}
function cur(): ?array
{
    if (empty($_SESSION['uid'])) return null;
    $s = db()->prepare('SELECT uid,role,name,email,subject,mobile,can_result,can_att,can_notice FROM users WHERE uid=?');
    $s->execute([$_SESSION['uid']]);
    return $s->fetch() ?: null;
}
