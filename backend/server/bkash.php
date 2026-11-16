<?php
/* bKash Tokenized Checkout helpers (cURL) */
function bkash_call(string $path, array $body, ?string $token = null): array
{
    if (!function_exists('curl_init')) throw new RuntimeException('PHP cURL extension is not enabled on this server');
    $h = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token === null) { $h[] = 'username: ' . BKASH_USERNAME; $h[] = 'password: ' . BKASH_PASSWORD; }
    else { $h[] = 'Authorization: ' . $token; $h[] = 'X-APP-Key: ' . BKASH_APP_KEY; }
    $ch = curl_init(rtrim(BKASH_BASE_URL, '/') . $path);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($body), CURLOPT_HTTPHEADER => $h,
        CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30, CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_USERAGENT => 'EduTrack/1.0 (PHP ' . PHP_VERSION . ')',   // some firewalls drop requests with no User-Agent
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,                       // many cPanel hosts have broken IPv6 -> connection hangs/timeouts
        CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2]);
    $res = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($res === false) {
        $n = curl_errno($ch); $e = curl_error($ch); curl_close($ch);
        error_log("EduTrack bKash curl error [$n] on $path: $e");
        throw new RuntimeException('Could not reach bKash (curl ' . $n . ': ' . $e . '). Ask your hosting to allow outbound HTTPS to tokenized.sandbox.bka.sh');
    }
    curl_close($ch);
    $j = json_decode($res, true);
    if (!is_array($j)) {
        error_log("EduTrack bKash HTTP $code on $path, non-JSON reply: " . substr(strip_tags($res), 0, 300));
        throw new RuntimeException("bKash returned an unexpected reply (HTTP $code)");
    }
    if ($code >= 400) error_log("EduTrack bKash HTTP $code on $path: " . substr(json_encode($j), 0, 300));
    return $j;
}

function bkash_token(): string
{
    $r = bkash_call('/tokenized/checkout/token/grant', ['app_key' => BKASH_APP_KEY, 'app_secret' => BKASH_APP_SECRET]);
    if (empty($r['id_token'])) {
        error_log('EduTrack bKash token grant failed: ' . substr(json_encode($r), 0, 300));
        throw new RuntimeException('bKash token error: ' . ($r['statusMessage'] ?? $r['message'] ?? 'no token returned'));
    }
    return $r['id_token'];
}

/* ask bKash for the real state of a payment (use when execute fails or times out) */
function bkash_status(string $paymentID, string $token): array
{
    return bkash_call('/tokenized/checkout/payment/status', ['paymentID' => $paymentID], $token);
}

function bkash_callback_url(): string
{
    if (defined('BKASH_CALLBACK_URL')) return BKASH_CALLBACK_URL;
    $host = preg_replace('/:\d+$/', '', (string)$_SERVER['HTTP_HOST']);                       // bKash rejects ports
    $local = in_array($host, ['localhost', '127.0.0.1'], true);
    return ($local && !is_https() ? 'http' : 'https') . '://' . $host . implode('/', array_map('rawurlencode', explode('/', rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\')))) . '/bkash_callback.php';   // bKash requires https; encode spaces etc. in folder names
}
