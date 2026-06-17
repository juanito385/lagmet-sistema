<?php

/* =========================
   IRONIX - OBTENER VERSIÓN GANTT
========================= */

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("documentacion", "ver");


require_once __DIR__ . "/../conexion.php";

date_default_timezone_set("America/Santiago");

$conn->set_charset("utf8mb4");


/* =========================
   VALIDAR MÉTODO
========================= */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


try {

    /* =========================
       CONSULTAR VERSIÓN
    ========================= */

    $sql = "
        SELECT 
            modulo,
            version,
            actualizado_en
        FROM sistema_versiones
        WHERE modulo = 'gantt_maquinas'
        LIMIT 1
    ";

    $resultado = $conn->query($sql);

    if (!$resultado) {
        throw new Exception("Error al consultar versión del Gantt.");
    }

    if ($resultado->num_rows === 0) {
        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "No existe versión registrada para gantt_maquinas."
        ], JSON_UNESCAPED_UNICODE);

        $conn->close();
        exit;
    }

    $fila = $resultado->fetch_assoc();

    echo json_encode([
        "success" => true,
        "modulo" => $fila["modulo"],
        "version" => intval($fila["version"]),
        "actualizado_en" => $fila["actualizado_en"]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {

    if (http_response_code() === 200) {
        http_response_code(500);
    }

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}


if (isset($conn) && $conn instanceof mysqli) {
    $conn->close();
}