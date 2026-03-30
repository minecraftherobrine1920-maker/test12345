<?php
/**
 * submit_dispute.php — Store a new dispute in the database
 *
 * Method:  POST (multipart/form-data to support optional file upload)
 * Fields:
 *   vehicle_number  (required)
 *   name            (required)
 *   email           (required)
 *   reason          (required)
 *   fine_id         (optional)
 *   proof           (optional file upload)
 *
 * Returns JSON:
 *   { status: "success", dispute_id: N }
 *   { status: "error",   message: "..." }
 */

// ---- CORS headers ----
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// ---- Only allow POST ----
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed. Use POST.']);
    exit;
}

// ---- Include DB connection ----
require_once 'db.php';

// ---- Collect & sanitize POST fields ----
$vehicle = isset($_POST['vehicle_number']) ? strtoupper(trim($_POST['vehicle_number'])) : '';
$name    = isset($_POST['name'])           ? trim($_POST['name'])                       : '';
$email   = isset($_POST['email'])          ? trim($_POST['email'])                      : '';
$reason  = isset($_POST['reason'])         ? trim($_POST['reason'])                     : '';
$fine_id = isset($_POST['fine_id'])        ? intval($_POST['fine_id'])                  : null;

// ---- Validate required fields ----
$errors = [];
if (empty($vehicle)) $errors[] = 'Vehicle number is required.';
if (empty($name))    $errors[] = 'Full name is required.';
if (empty($email))   $errors[] = 'Email address is required.';
if (empty($reason))  $errors[] = 'Dispute reason is required.';
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email address format.';
}

if (!empty($errors)) {
    echo json_encode([
        'status'  => 'error',
        'message' => implode(' ', $errors)
    ]);
    exit;
}

// ---- Handle optional file upload ----
$proof_path = null;

if (isset($_FILES['proof']) && $_FILES['proof']['error'] === UPLOAD_ERR_OK) {
    $file     = $_FILES['proof'];
    $maxSize  = 5 * 1024 * 1024; // 5 MB
    $allowed  = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    $finfo    = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if ($file['size'] > $maxSize) {
        echo json_encode(['status' => 'error', 'message' => 'File too large. Maximum size is 5 MB.']);
        exit;
    }

    if (!in_array($mimeType, $allowed)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Allowed: JPG, PNG, GIF, PDF.']);
        exit;
    }

    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/../uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $ext        = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename   = 'proof_' . time() . '_' . uniqid() . '.' . $ext;
    $targetPath = $uploadDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $proof_path = 'uploads/' . $filename;
    }
}

// ---- Insert dispute into database ----
$stmt = $conn->prepare(
    "INSERT INTO disputes (vehicle_number, fine_id, name, email, reason, proof_path, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW())"
);

if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Query preparation failed: ' . $conn->error]);
    exit;
}

$stmt->bind_param('sissss', $vehicle, $fine_id, $name, $email, $reason, $proof_path);

if ($stmt->execute()) {
    $dispute_id = $conn->insert_id;
    echo json_encode([
        'status'     => 'success',
        'message'    => 'Dispute submitted successfully.',
        'dispute_id' => $dispute_id
    ]);
} else {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to save dispute: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
