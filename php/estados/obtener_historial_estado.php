<?php

/* =========================
   IRONIX - OBTENER HISTORIAL DE ESTADOS
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("GET");
ironixRequerirPermiso("estados", "ver");


require_once __DIR__ . "/../conexion.php";

date_default_timezone_set("America/Santiago");


/* =========================
   VARIABLES DE CONTROL
========================= */

$httpCode = 500;


try {

    if (!isset($conn) || !($conn instanceof mysqli)) {
        throw new Exception("No se encontró la conexión a la base de datos.");
    }

    $conn->set_charset("utf8mb4");


    /* =========================
       RECIBIR PARÁMETRO
    ========================= */

    $produccionId = isset($_GET["produccion_id"]) ? intval($_GET["produccion_id"]) : 0;

    if ($produccionId <= 0) {
        $httpCode = 400;
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

    $historial = [];

    while ($row = $result->fetch_assoc()) {
        $historial[] = [
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

    $conn->close();

    ironixResponderJson([
        "success" => true,
        "message" => "Historial obtenido correctamente.",
        "data" => $historial
    ], 200);

} catch (Throwable $e) {

    if (isset($stmt) && $stmt instanceof mysqli_stmt) {
        $stmt->close();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => $e->getMessage(),
        "data" => []
    ], $httpCode);
}