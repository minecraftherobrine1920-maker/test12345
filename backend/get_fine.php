<?php
/**
 * get_fine.php — Fetch traffic fine details by vehicle number
 *
 * Method:  GET
 * Param:   vehicle (string) — the vehicle registration number
 *
 * Returns JSON:
 *   { status: "found",    fine: { ... } }   — fine found
 *   { status: "not_found", message: "..." } — no fine
 *   { status: "error",    message: "..." }  — server error
 */

// ---- CORS headers (for local dev) ----
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ---- Include DB connection ----
require_once 'db.php';

// ---- Validate input ----
$vehicle = isset($_GET['vehicle']) ? trim($_GET['vehicle']) : '';

if (empty($vehicle)) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Vehicle number is required.'
    ]);
    exit;
}

// ---- Sanitize: uppercase, remove spaces ----
$vehicle = strtoupper(preg_replace('/\s+/', '', $vehicle));

// ---- Prepared statement to prevent SQL injection ----
$stmt = $conn->prepare(
    "SELECT id, vehicle_number, date, time, location, violation,
            amount, image_url, latitude, longitude
     FROM fines
     WHERE UPPER(REPLACE(vehicle_number, ' ', '')) = ?
     LIMIT 1"
);

if (!$stmt) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Query preparation failed: ' . $conn->error
    ]);
    exit;
}

$stmt->bind_param('s', $vehicle);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // No fine found
    echo json_encode([
        'status'  => 'not_found',
        'message' => "No pending fine found for vehicle number: $vehicle"
    ]);
} else {
    // Fine found — return as JSON
    $fine = $result->fetch_assoc();
    echo json_encode([
        'status' => 'found',
        'fine'   => $fine
    ]);
}

$stmt->close();
$conn->close();
?>
