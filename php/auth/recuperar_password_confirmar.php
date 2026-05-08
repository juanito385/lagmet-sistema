<?php
header('Content-Type: application/json');
require_once __DIR__ . "/../conexion.php";

$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

if ($email === '' || $password === '') {
    echo json_encode(["success" => false]);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("
    UPDATE usuarios 
    SET password = ?,
        codigo_recuperacion = NULL,
        codigo_expira = NULL
    WHERE correo = ?
");

if (!$stmt) {
    echo json_encode(["success" => false]);
    exit;
}

$stmt->bind_param("ss", $hash, $email);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false]);
}

$stmt->close();
$conn->close();
?>