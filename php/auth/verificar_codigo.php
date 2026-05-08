<?php
header('Content-Type: application/json');
require_once __DIR__ . "/../conexion.php";

$email = trim($_POST['email'] ?? '');
$codigo = trim($_POST['codigo'] ?? '');

if ($email === '' || $codigo === '') {
    echo json_encode(["success" => false]);
    exit;
}

$stmt = $conn->prepare("
    SELECT id 
    FROM usuarios 
    WHERE correo = ?
    AND codigo_recuperacion = ?
    AND codigo_expira > NOW()
");

if (!$stmt) {
    echo json_encode(["success" => false]);
    exit;
}

$stmt->bind_param("ss", $email, $codigo);
$stmt->execute();

$result = $stmt->get_result();

if ($result && $result->num_rows > 0) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false]);
}

$stmt->close();
$conn->close();
?>