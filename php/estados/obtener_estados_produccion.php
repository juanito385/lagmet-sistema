<?php

/* =========================
   IRONIX - OBTENER ESTADOS DE PRODUCCIÓN
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("estados", "ver");


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


/* =========================
   VALIDAR MÉTODO
========================= */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Método no permitido",
        "cards" => [
            "pendiente" => 0,
            "en_proceso" => 0,
            "pausado" => 0,
            "terminado" => 0,
            "entregado" => 0,
            "atrasado" => 0
        ],
        "data" => []
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* =========================
   RESPUESTA BASE
========================= */

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
   OBTENER PRODUCCIÓN CON ESTADO REAL + ALERTA TEMPORAL

   estado_actual:
   - pendiente
   - en_proceso
   - pausado
   - terminado
   - entregado

   esta_atrasado:
   - true si fecha_fin ya venció
   - false si no está atrasado

   Importante:
   "atrasado" NO reemplaza al estado real.
========================= */

$sql = "
    SELECT 
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

    ORDER BY p.id DESC
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error SQL: " . $conn->error,
        "cards" => $response["cards"],
        "data" => []
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}


/* =========================
   PROCESAR RESULTADOS
========================= */

while ($row = $result->fetch_assoc()) {

    $estadoReal = $row["estado_actual"] ?: "pendiente";
    $estaAtrasado = intval($row["esta_atrasado"]) === 1;

    /* =========================
       CONTADOR DE ESTADO REAL
    ========================= */

    if (isset($response["cards"][$estadoReal])) {
        $response["cards"][$estadoReal]++;
    } else {
        $response["cards"]["pendiente"]++;
        $estadoReal = "pendiente";
    }

    /* =========================
       CONTADOR DE ALERTA ATRASADO
    ========================= */

    if ($estaAtrasado) {
        $response["cards"]["atrasado"]++;
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

        /*
            Estado real guardado en BD.
            Esto es lo que debe mostrar el badge principal.
        */
        "estado_actual" => $estadoReal,
        "estado_real" => $estadoReal,
        "estado_bd" => $estadoReal,

        /*
            Alerta temporal.
            Esto es lo que usaremos para mostrar el triángulo rojo.
        */
        "esta_atrasado" => $estaAtrasado,
        "alerta_temporal" => $estaAtrasado ? "atrasado" : null,

        "operador" => $row["operador"]
    ];
}


/* =========================
   RESPUESTA FINAL
========================= */

echo json_encode($response, JSON_UNESCAPED_UNICODE);

$conn->close();