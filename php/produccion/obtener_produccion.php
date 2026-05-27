<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . "/../conexion.php";

$sql = "SELECT 
            p.id, 
            p.producto, 
            p.numero_pedido, 
            p.codigo, 
            p.cantidad, 
            p.fecha,
            p.fecha_fin,
            p.fecha_fin_real,
            p.tiempo_muerto,
            p.dias,
            p.grupo,
            p.almuerzo,
            p.trabaja_sabado,
            p.salida,
            p.fallo_maquina,
            p.maquina_fallo,
            p.turno,
            p.estado_actual,
            p.fecha_estado_actual,

            u.nombre AS usuario,
            s.descripcion AS situacion_descripcion,

            COALESCE(
                (
                    SELECT pm.maquina
                    FROM produccion_maquinas pm
                    WHERE pm.produccion_id = p.id
                    AND pm.uso = 'si'
                    ORDER BY 
                        CASE 
                            WHEN pm.orden_proceso IS NULL THEN 999 
                            ELSE pm.orden_proceso 
                        END ASC,
                        pm.id ASC
                    LIMIT 1
                ),
                'Sin máquina'
            ) AS maquina,

           COALESCE(
                (
                    SELECT GROUP_CONCAT(
                        pm.maquina 
                        ORDER BY 
                            CASE 
                                WHEN pm.orden_proceso IS NULL THEN 999 
                                ELSE pm.orden_proceso 
                            END ASC,
                            pm.id ASC
                        SEPARATOR '||'
                    )
                    FROM produccion_maquinas pm
                    WHERE pm.produccion_id = p.id
                    AND pm.uso = 'si'
                ),
                'Sin máquina'
            ) AS maquinas_utilizadas,

            CASE
                /* Si todavía NO está terminado/entregado y la fecha estimada venció */
                WHEN p.estado_actual NOT IN ('terminado', 'entregado')
                    AND p.fecha_fin IS NOT NULL
                    AND p.fecha_fin != ''
                    AND p.fecha_fin < CURDATE()
                THEN 1

                /* Si ya está terminado/entregado, pero terminó después de la fecha estimada */
                WHEN p.estado_actual IN ('terminado', 'entregado')
                    AND p.fecha_fin IS NOT NULL
                    AND p.fecha_fin != ''
                    AND p.fecha_fin_real IS NOT NULL
                    AND p.fecha_fin_real != ''
                    AND DATE(p.fecha_fin_real) > DATE(p.fecha_fin)
                THEN 1

                ELSE 0
            END AS esta_atrasado

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

        $estadoReal = $row["estado_actual"] ?: "pendiente";

        $row["estado_actual"] = $estadoReal;
        $row["estado_real"] = $estadoReal;
        $row["estado_bd"] = $estadoReal;
        $row["esta_atrasado"] = intval($row["esta_atrasado"]) === 1;

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