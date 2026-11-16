<?php
/* Front-controller dispatcher */
function dispatch(string $a, array $routes): void
{
    if (!isset($routes[$a])) fail('Unknown action', 404);
    [$cls, $method, $access] = $routes[$a];

    if ($a !== 'init') {                                                // every action except 'init' is POST + CSRF protected
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('POST only', 405);
        if (!hash_equals($_SESSION['csrf'] ?? '', $_SERVER['HTTP_X_CSRF'] ?? '')) fail('Session expired. Please reload the page.', 403);
    }
    $in = json_decode(file_get_contents('php://input'), true);
    if (!is_array($in)) $in = [];

    $u = null;
    if ($access !== 'public') {
        $u = cur();
        if (!$u) fail('Not logged in', 401);
    }
    $cls::$method($u, $in);
}
