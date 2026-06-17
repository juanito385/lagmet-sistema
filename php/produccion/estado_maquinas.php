<?php

/* =========================
   IRONIX - ESTADO USO DE MÁQUINAS
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("monitoreo", "ver");


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
        "data" => []
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* =========================
   CONSULTAR ESTADO DE USO
========================= */

$sql = "
    SELECT 
        m.id,
        m.numero_maquina,
        m.nombre_maquina,
        m.zona,
        m.estado AS estado_maquina,

        CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM produccion_maquinas pm
                WHERE pm.id_maquina = m.id
                AND pm.uso = 'si'
            ) 
            THEN 'Si'
            ELSE 'No'
        END AS estado

    FROM maquinas m
    ORDER BY m.numero_maquina ASC
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al obtener estado de máquinas",
        "error" => $conn->error,
        "data" => []
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = [
        "id" => intval($row["id"]),
        "numero_maquina" => intval($row["numero_maquina"]),
        "nombre_maquina" => $row["nombre_maquina"],
        "zona" => $row["zona"],
        "estado_maquina" => $row["estado_maquina"],
        "estado" => $row["estado"]
    ];
}


/* =========================
   RESPUESTA
========================= */

echo json_encode([
    "success" => true,
    "data" => $data
], JSON_UNESCAPED_UNICODE);

$conn->close();