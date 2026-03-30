<?php
/**
 * get_disputes.php — Fetch all submitted disputes
 *
 * Method:  GET
 * Params:  (none required)
 *   status   (optional) — filter by status: Pending | Approved | Rejected
 *   vehicle  (optional) — filter by vehicle number
 *
 * Returns JSON:
 *   { status: "success", disputes: [ {...}, ... ], total: N }
 *   { status: "error",   message: "..." }
 */

// ---- CORS headers ----
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ---- Include DB connection ----
require_once 'db.php';

// ---- Optional filters ----
$statusFilter  = isset($_GET['status'])  ? trim($_GET['status'])                        : '';
$vehicleFilter = isset($_GET['vehicle']) ? strtoupper(trim($_GET['vehicle']))            : '';

// ---- Build query dynamically ----
$query  = "SELECT id, vehicle_number, name, email, reason, proof_path, status, created_at
           FROM disputes";
$params = [];
$types  = '';

$conditions = [];
if (!empty($statusFilter)) {
    $conditions[] = "status = ?";
    $params[]     = $statusFilter;
    $types       .= 's';
}
if (!empty($vehicleFilter)) {
    $conditions[] = "UPPER(vehicle_number) = ?";
    $params[]     = $vehicleFilter;
    $types       .= 's';
}

if (!empty($conditions)) {
    $query .= ' WHERE ' . implode(' AND ', $conditions);
}

$query .= " ORDER BY created_at DESC";

// ---- Prepare & execute ----
$stmt = $conn->prepare($query);

if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Query preparation failed: ' . $conn->error]);
    exit;
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$disputes = [];
while ($row = $result->fetch_assoc()) {
    $disputes[] = $row;
}

echo json_encode([
    'status'   => 'success',
    'disputes' => $disputes,
    'total'    => count($disputes)
]);

$stmt->close();
$conn->close();
?>
