<?php
header('Content-Type: application/json');
require_once __DIR__ . "/conexion.php";

$sql = "SELECT 
            p.id, 
            p.producto, 
            p.numero_pedido, 
            p.codigo, 
            p.cantidad, 
            p.fecha,
            p.fecha_fin,
            p.tiempo_muerto,
            p.dias,
            p.grupo,
            p.almuerzo,
            p.trabaja_sabado,
            p.salida,
            p.fallo_maquina,
            p.maquina_fallo,
            s.descripcion AS situacion_descripcion
        FROM produccion p
        LEFT JOIN situaciones_produccion s
            ON p.id = s.produccion_id
        ORDER BY p.id DESC";

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
        "message" => "Error al obtener producción: " . $conn->error
    ]);
}

$conn->close();
?>