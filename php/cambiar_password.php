<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
include("conexion.php");

$id = 1;

$actual = $_POST['actual'] ?? '';
$nueva = $_POST['nueva'] ?? '';
$confirmar = $_POST['confirmar'] ?? '';

if ($actual == '' || $nueva == '' || $confirmar == '') {
    echo json_encode(["success" => false, "message" => "Completa todos los campos"]);
    exit;
}

if ($nueva !== $confirmar) {
    echo json_encode(["success" => false, "message" => "Las contraseñas no coinciden"]);
    exit;
}

$sql = "SELECT password FROM usuarios WHERE id = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Error en prepare"]);
    exit;
}

$stmt->bind_param("i", $id);
$stmt->execute();

$result = $stmt->get_result();

if (!$result || $result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Usuario no encontrado"]);
    exit;
}

$usuario = $result->fetch_assoc();

if (!isset($usuario['password'])) {
    echo json_encode(["success" => false, "message" => "Error interno"]);
    exit;
}

// 🔐 Validar contraseña actual
if (!password_verify($actual, $usuario['password'])) {
    echo json_encode(["success" => false, "message" => "Contraseña actual incorrecta"]);
    exit;
}

// 🔐 Generar nuevo hash
$nuevaHash = password_hash($nueva, PASSWORD_DEFAULT);

$sqlUpdate = "UPDATE usuarios SET password = ? WHERE id = ?";
$stmtUpdate = $conn->prepare($sqlUpdate);

if (!$stmtUpdate) {
    echo json_encode(["success" => false, "message" => "Error en update"]);
    exit;
}

$stmtUpdate->bind_param("si", $nuevaHash, $id);

if ($stmtUpdate->execute()) {
    echo json_encode(["success" => true, "message" => "Contraseña actualizada correctamente"]);
} else {
    echo json_encode(["success" => false, "message" => "Error al actualizar contraseña"]);
}
?>