<?php
header('Content-Type: application/json');
include("conexion.php");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$id = intval($input["id"] ?? 0);

if ($id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID inválido"
    ]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM produccion WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Registro eliminado correctamente"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "No se pudo eliminar"
    ]);
}

$stmt->close();
$conn->close();
?>