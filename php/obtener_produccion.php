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
            p.turno,
            u.nombre AS usuario,
            s.descripcion AS situacion_descripcion,

            COALESCE(
                (
                    SELECT pm.maquina
                    FROM produccion_maquinas pm
                    WHERE pm.produccion_id = p.id
                      AND pm.uso = 'si'
                    ORDER BY pm.horas DESC, pm.minutos DESC
                    LIMIT 1
                ),
                'Sin máquina'
            ) AS maquina

        FROM produccion p

        LEFT JOIN usuarios u
            ON p.usuario_id = u.id

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