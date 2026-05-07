<?php
header('Content-Type: application/json');
require_once __DIR__ . "/conexion.php";

$id = intval($_GET["id"] ?? 0);

if ($id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID inválido"
    ]);
    exit;
}

$stmt = $conn->prepare("
    SELECT id_maquina, zona, maquina, uso, horas, minutos
    FROM produccion_maquinas
    WHERE produccion_id = ?
");

$stmt->bind_param("i", $id);
$stmt->execute();

$result = $stmt->get_result();

$maquinas = [];

while ($row = $result->fetch_assoc()) {
    $maquinas[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $maquinas
]);

$stmt->close();
$conn->close();
?>