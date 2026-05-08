<?php
header('Content-Type: application/json');
require_once __DIR__ . "/../conexion.php";

$id = 1;

$nombre = $_POST['nombre'] ?? '';
$correo = $_POST['correo'] ?? '';

if ($nombre == '' || $correo == '') {
    echo json_encode(["success" => false, "message" => "Campos vacíos"]);
    exit;
}

$sql = "UPDATE usuarios SET nombre = ?, correo = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssi", $nombre, $correo, $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false]);
}
?>