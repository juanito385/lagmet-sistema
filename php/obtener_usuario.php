<?php
header('Content-Type: application/json');
include("conexion.php");

// ⚠️ Por ahora usamos el usuario 1 (admin)
$id = 1;

$sql = "SELECT id, nombre, correo, rol FROM usuarios WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        "success" => true,
        "usuario" => $result->fetch_assoc()
    ]);
} else {
    echo json_encode([
        "success" => false
    ]);
}
?>