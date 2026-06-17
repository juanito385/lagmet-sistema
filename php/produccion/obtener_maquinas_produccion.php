<?php

/* =========================
   IRONIX - OBTENER MÁQUINAS DE PRODUCCIÓN
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("produccion", "ver");


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
   RECIBIR ID
========================= */

$id = intval($_GET["id"] ?? 0);

if ($id <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID inválido",
        "data" => []
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* =========================
   VALIDAR PRODUCCIÓN
========================= */

$check = $conn->prepare("
    SELECT id
    FROM produccion
    WHERE id = ?
    LIMIT 1
");

if (!$check) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al preparar validación de producción",
        "data" => []
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$check->bind_param("i", $id);

if (!$check->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al validar producción",
        "data" => []
    ], JSON_UNESCAPED_UNICODE);

    $check->close();
    $conn->close();
    exit;
}

$resultCheck = $check->get_result();

if (!$resultCheck || $resultCheck->num_rows === 0) {
    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Producción no encontrada",
        "data" => []
    ], JSON_UNESCAPED_UNICODE);

    $check->close();
    $conn->close();
    exit;
}

$check->close();


/* =========================
   CONSULTAR MÁQUINAS
========================= */

$stmt = $conn->prepare("
    SELECT 
        id_maquina, 
        zona, 
        maquina, 
        uso, 
        orden_proceso,
        horas, 
        minutos
    FROM produccion_maquinas
    WHERE produccion_id = ?
    ORDER BY 
        CASE 
            WHEN orden_proceso IS NULL THEN 999 
            ELSE orden_proceso 
        END ASC,
        id ASC
");

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al preparar consulta de máquinas: " . $conn->error,
        "data" => []
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmt->bind_param("i", $id);

if (!$stmt->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al ejecutar consulta de máquinas",
        "data" => []
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();
    $conn->close();
    exit;
}

$result = $stmt->get_result();

$maquinas = [];

while ($row = $result->fetch_assoc()) {
    $maquinas[] = [
        "id_maquina" => intval($row["id_maquina"]),
        "zona" => $row["zona"],
        "maquina" => $row["maquina"],
        "uso" => $row["uso"],
        "orden_proceso" => $row["orden_proceso"] !== null ? intval($row["orden_proceso"]) : null,
        "horas" => intval($row["horas"]),
        "minutos" => intval($row["minutos"])
    ];
}


/* =========================
   RESPUESTA
========================= */

echo json_encode([
    "success" => true,
    "data" => $maquinas
], JSON_UNESCAPED_UNICODE);

$stmt->close();
$conn->close();