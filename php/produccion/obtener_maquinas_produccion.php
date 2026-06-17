<?php

/* =========================
   IRONIX - OBTENER MÁQUINAS DE PRODUCCIÓN
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("GET");
ironixRequerirPermiso("produccion", "ver");


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


/* =========================
   RECIBIR ID
========================= */

$id = intval($_GET["id"] ?? 0);

if ($id <= 0) {
    $conn->close();

    ironixResponderJson([
        "success" => false,
        "message" => "ID inválido",
        "data" => []
    ], 400);
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
    $error = $conn->error;
    $conn->close();

    ironixResponderJson([
        "success" => false,
        "message" => "Error al preparar validación de producción: " . $error,
        "data" => []
    ], 500);
}

$check->bind_param("i", $id);

if (!$check->execute()) {
    $error = $check->error;

    $check->close();
    $conn->close();

    ironixResponderJson([
        "success" => false,
        "message" => "Error al validar producción: " . $error,
        "data" => []
    ], 500);
}

$resultCheck = $check->get_result();

if (!$resultCheck || $resultCheck->num_rows === 0) {
    $check->close();
    $conn->close();

    ironixResponderJson([
        "success" => false,
        "message" => "Producción no encontrada",
        "data" => []
    ], 404);
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
    $error = $conn->error;
    $conn->close();

    ironixResponderJson([
        "success" => false,
        "message" => "Error al preparar consulta de máquinas: " . $error,
        "data" => []
    ], 500);
}

$stmt->bind_param("i", $id);

if (!$stmt->execute()) {
    $error = $stmt->error;

    $stmt->close();
    $conn->close();

    ironixResponderJson([
        "success" => false,
        "message" => "Error al ejecutar consulta de máquinas: " . $error,
        "data" => []
    ], 500);
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

$stmt->close();
$conn->close();

ironixResponderJson([
    "success" => true,
    "data" => $maquinas
], 200);