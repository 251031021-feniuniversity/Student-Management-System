<?php
/* ===== Backend entry point:  backend/index.php?api=ACTION ===== */
require __DIR__ . '/server/config.php';
require __DIR__ . '/server/helpers.php';
require __DIR__ . '/server/database.php';
require __DIR__ . '/server/router.php';
require __DIR__ . '/server/bkash.php';
foreach (glob(__DIR__ . '/controllers/*.php') as $f) require_once $f;
$routes = require __DIR__ . '/routes/api.php';

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

try {
    dispatch((string)($_GET['api'] ?? ''), $routes);
} catch (Throwable $e) {
    try { if (db()->inTransaction()) db()->rollBack(); } catch (Throwable $e2) {}
    error_log('EduTrack: ' . $e->getMessage());
    fail('Server error. Please try again.', 500);
}
