<?php
header('Content-Type: application/json');
require_once __DIR__ . "/conexion.php";

$sql = "SELECT 
            id, 
            producto, 
            numero_pedido, 
            codigo, 
            cantidad, 
            fecha,
            fecha_fin,
            dias,
            trabaja_sabado
        FROM produccion 
        ORDER BY id DESC";

$result = $conn->query($sql);

$datos = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $datos[] = $row;
    }

    echo json_encode([
        "success" => true,
        "data" => $datos
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Error al obtener producción"
    ]);
}

$conn->close();
?>