<?php
/**
 * db.php — Database Connection
 * Smart Traffic Fine Verification System
 *
 * HOW TO USE:
 *   require_once 'db.php';
 *   // $conn is now available as a MySQLi connection object
 */

// ---- Database Configuration ----
define('DB_HOST',     'localhost');
define('DB_USER',     'root');       // Default XAMPP username
define('DB_PASSWORD', '');           // Default XAMPP password (empty)
define('DB_NAME',     'traffic_fines');
define('DB_PORT',     3306);

// ---- Create Connection ----
$conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);

// ---- Check for Connection Error ----
if ($conn->connect_error) {
    // Return JSON error (useful for API endpoints)
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]);
    exit;
}

// ---- Set charset to UTF-8 ----
$conn->set_charset('utf8mb4');
?>
