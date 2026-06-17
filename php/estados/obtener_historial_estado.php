<?php

/* =========================
   IRONIX - OBTENER HISTORIAL DE ESTADOS
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("estados", "ver");


require_once __DIR__ . "/../conexion.php";

date_default_timezone_set("America/Santiago");


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
   RESPUESTA BASE
========================= */

$response = [
    "success" => false,
    "message" => "",
    "data" => []
];


try {

    if (!isset($conn)) {
        throw new Exception("No se encontró la conexión a la base de datos.");
    }

    $conn->set_charset("utf8mb4");


    /* =========================
       RECIBIR PARÁMETRO
    ========================= */

    $produccionId = isset($_GET["produccion_id"]) ? intval($_GET["produccion_id"]) : 0;

    if ($produccionId <= 0) {
        http_response_code(400);
        throw new Exception("ID de producción inválido.");
    }


    /* =========================
       CONSULTAR HISTORIAL
    ========================= */

    $stmt = $conn->prepare("
        SELECT 
            id,
            produccion_id,
            estado_anterior,
            estado_nuevo,
            observacion,
            usuario_id,
            usuario_nombre,
            fecha_cambio
        FROM historial_estados
        WHERE produccion_id = ?
        ORDER BY fecha_cambio DESC
    ");

    if (!$stmt) {
        throw new Exception("Error al preparar consulta de historial: " . $conn->error);
    }

    $stmt->bind_param("i", $produccionId);

    if (!$stmt->execute()) {
        throw new Exception("Error al ejecutar consulta de historial: " . $stmt->error);
    }

    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $response["data"][] = [
            "id" => intval($row["id"]),
            "produccion_id" => intval($row["produccion_id"]),
            "estado_anterior" => $row["estado_anterior"],
            "estado_nuevo" => $row["estado_nuevo"],
            "observacion" => $row["observacion"],
            "usuario_id" => $row["usuario_id"] !== null ? intval($row["usuario_id"]) : null,
            "usuario_nombre" => $row["usuario_nombre"] ?: "Usuario IRONIX",
            "fecha_cambio" => $row["fecha_cambio"]
        ];
    }

    $stmt->close();


    /* =========================
       RESPUESTA OK
    ========================= */

    $response["success"] = true;
    $response["message"] = "Historial obtenido correctamente.";

} catch (Throwable $e) {

    if (http_response_code() === 200) {
        http_response_code(500);
    }

    $response = [
        "success" => false,
        "message" => $e->getMessage(),
        "data" => []
    ];
}


echo json_encode($response, JSON_UNESCAPED_UNICODE);

if (isset($conn) && $conn instanceof mysqli) {
    $conn->close();
}