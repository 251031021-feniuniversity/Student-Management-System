<?php
/* bKash connection check — log in as admin in another tab first, open this page, then DELETE this file. */
require __DIR__ . '/server/config.php';
require __DIR__ . '/server/helpers.php';
require __DIR__ . '/server/database.php';
require __DIR__ . '/server/bkash.php';
header('Content-Type: text/plain; charset=utf-8');
$u = cur();
if (!$u || $u['role'] !== 'admin') { http_response_code(403); exit("Log in as admin first, then reload this page.\n"); }
echo "PHP " . PHP_VERSION . "\n";
echo "cURL extension: " . (function_exists('curl_init') ? 'OK' : 'MISSING  <-- enable it in cPanel > Select PHP Version') . "\n";
echo "HTTPS: " . (is_https() ? 'yes' : 'NO (bKash callback will be http)') . "\n";
echo "Callback URL: " . (defined('BKASH_CALLBACK_URL') ? BKASH_CALLBACK_URL : (is_https() ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\') . '/bkash_callback.php') . "\n";
echo "bKash base URL: " . BKASH_BASE_URL . "\n";
$host = parse_url(BKASH_BASE_URL, PHP_URL_HOST);
$ip = gethostbyname($host);
echo "DNS $host -> " . ($ip === $host ? 'FAILED (hosting cannot resolve bKash domain)' : $ip) . "\n\n";
try { $t = bkash_token(); echo "Token grant: OK\n"; }
catch (Throwable $e) { exit("Token grant: FAILED -> " . $e->getMessage() . "\n(see the PHP error log for more detail)\n"); }
try {
    $r = bkash_call('/tokenized/checkout/create', ['mode' => '0011', 'payerReference' => '01700000000', 'callbackURL' => 'https://example.com/cb',
        'amount' => '10.00', 'currency' => 'BDT', 'intent' => 'sale', 'merchantInvoiceNumber' => 'TEST' . time()], $t);
    echo "Create payment: " . (($r['statusCode'] ?? '') === '0000' ? 'OK' : 'FAILED -> ' . ($r['statusMessage'] ?? json_encode($r))) . "\n";
    echo "Raw reply: " . substr(json_encode($r), 0, 400) . "\n";
} catch (Throwable $e) { echo "Create payment: FAILED -> " . $e->getMessage() . "\n"; }
