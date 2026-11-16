<?php
/* ============ CONFIG — edit these for your hosting ============ */
define('DB_HOST', 'localhost');
define('DB_NAME', 'snbhqudd_my_book');
define('DB_USER', 'snbhqudd_book');
define('DB_PASS', 'x6#nWkraBghFxEV');

/* ---- bKash Tokenized Checkout ----
   BKASH_MODE:  'sandbox' = test mode (fake money, bKash test wallet)
                'live'    = real payments (needs your merchant credentials below) */
define('BKASH_MODE', 'sandbox');

if (BKASH_MODE === 'live') {
    define('BKASH_USERNAME',   'YOUR_LIVE_USERNAME');
    define('BKASH_PASSWORD',   'YOUR_LIVE_PASSWORD');
    define('BKASH_APP_KEY',    'YOUR_LIVE_APP_KEY');
    define('BKASH_APP_SECRET', 'YOUR_LIVE_APP_SECRET');
    define('BKASH_BASE_URL',   'https://tokenized.pay.bka.sh/v1.2.0-beta');
} else {
    /* SANDBOX / TEST MODE */
    define('BKASH_USERNAME',   'sandboxTokenizedUser02');
    define('BKASH_PASSWORD',   'sandboxTokenizedUser02@12345');
    define('BKASH_APP_KEY',    '4f6o0cjiki2rfm34kfdadl1eqq');
    define('BKASH_APP_SECRET', '2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b');
    define('BKASH_BASE_URL',   'https://tokenized.sandbox.bka.sh/v1.2.0-beta');
}
// If you get "Invalid Merchant Callback URL", remove the // below and put your real https domain:
// define('BKASH_CALLBACK_URL', 'https://yourdomain.com/backend/bkash_callback.php');

define('SQL_FILE', dirname(__DIR__, 2) . '/database/database.sql');
date_default_timezone_set('Asia/Dhaka');

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (int)($_SERVER['SERVER_PORT'] ?? 0) === 443
        || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
        || strtolower($_SERVER['HTTP_X_FORWARDED_SSL'] ?? '') === 'on'
        || strpos($_SERVER['HTTP_CF_VISITOR'] ?? '', '"scheme":"https"') !== false;      // Cloudflare
}

session_name('edutrack_sid');
session_set_cookie_params(['path' => '/', 'httponly' => true, 'samesite' => 'Lax', 'secure' => is_https()]);
session_start();
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
