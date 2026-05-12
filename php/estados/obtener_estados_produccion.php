<?php
header('Content-Type: application/json');
require_once __DIR__ . "/../conexion.php";

$response = [
    "success" => true,
    "cards" => [
        "pendiente" => 0,
        "en_proceso" => 0,
        "pausado" => 0,
        "terminado" => 0,
        "entregado" => 0,
        "atrasado" => 0
    ],
    "data" => []
];

/* =========================
   OBTENER PRODUCCIÓN CON ESTADO REAL
   Si no está terminado/entregado y fecha_fin venció,
   se muestra como atrasado.
========================= */

$sql = "SELECT 
            p.id,
            p.numero_pedido,
            p.producto,
            p.codigo,
            p.cantidad,
            p.fecha,
            p.fecha_fin,
            p.fecha_fin_real,
            p.estado_actual,
            p.fecha_estado_actual,
            COALESCE(u.nombre, 'Admin') AS operador,

            COALESCE(
                GROUP_CONCAT(
                    CASE 
                        WHEN pm.uso = 'si' THEN pm.maquina 
                    END
                    SEPARATOR ', '
                ),
                'Sin máquina'
            ) AS maquinas_usadas,

            CASE
                WHEN p.estado_actual NOT IN ('terminado', 'entregado')
                     AND p.fecha_fin IS NOT NULL
                     AND p.fecha_fin != ''
                     AND p.fecha_fin < CURDATE()
                THEN 'atrasado'
                ELSE p.estado_actual
            END AS estado_visual

        FROM produccion p

        LEFT JOIN produccion_maquinas pm
            ON p.id = pm.produccion_id

        LEFT JOIN usuarios u
            ON p.usuario_id = u.id

        GROUP BY 
            p.id,
            p.numero_pedido,
            p.producto,
            p.codigo,
            p.cantidad,
            p.fecha,
            p.fecha_fin,
            p.fecha_fin_real,
            p.estado_actual,
            p.fecha_estado_actual,
            u.nombre

        ORDER BY p.id DESC";

$result = $conn->query($sql);

if (!$result) {
    echo json_encode([
        "success" => false,
        "message" => "Error SQL: " . $conn->error
    ]);
    exit;
}

while ($row = $result->fetch_assoc()) {

    $estado = $row["estado_visual"] ?: "pendiente";

    if (isset($response["cards"][$estado])) {
        $response["cards"][$estado]++;
    }

    $response["data"][] = [
        "id" => intval($row["id"]),
        "orden" => $row["numero_pedido"] ?: "Sin orden",
        "producto" => $row["producto"],
        "codigo" => $row["codigo"],
        "cantidad" => intval($row["cantidad"]),
        "maquina" => $row["maquinas_usadas"],
        "fecha_inicio" => $row["fecha"],
        "fecha_fin_estimada" => $row["fecha_fin"],
        "fecha_fin_real" => $row["fecha_fin_real"],
        "estado_actual" => $estado,
        "estado_bd" => $row["estado_actual"],
        "operador" => $row["operador"]
    ];
}

echo json_encode($response);
$conn->close();
?>