<?php
/* PDO connection + automatic table creation (runs database/database.sql when tables are missing) */
function db(): PDO
{
    static $p = null;
    if ($p) return $p;
    $p = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone='+06:00'",
    ]);
    try { $p->query('SELECT 1 FROM bkash_payments LIMIT 1'); }       // last table in the schema
    catch (Throwable $e) { install($p); }
    try { $p->query('SELECT payer FROM bkash_payments LIMIT 1'); }       // add the payer column to a table created by an earlier version
    catch (Throwable $e) { try { $p->exec('ALTER TABLE bkash_payments ADD COLUMN payer VARCHAR(20) NULL'); } catch (Throwable $e2) {} }
    return $p;
}

function install(PDO $p): void
{
    $sql = file_get_contents(SQL_FILE);
    if ($sql === false) throw new RuntimeException('database.sql not found');
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);                   // strip comments
    foreach (preg_split('/;\s*[\r\n]+/', $sql) as $stmt) {
        $stmt = trim($stmt);
        if ($stmt !== '') $p->exec($stmt);
    }
    if ((int)$p->query('SELECT COUNT(*) FROM users')->fetchColumn() === 0) {   // safety net
        $p->prepare("INSERT INTO users (uid,password,role,name,email) VALUES ('admin',?,'admin','System Admin','admin@edu.bd')")
          ->execute([password_hash('admin123', PASSWORD_DEFAULT)]);
    }
}
