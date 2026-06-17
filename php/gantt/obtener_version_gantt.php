<?php

/* =========================
   IRONIX - OBTENER VERSIÓN GANTT
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("GET");
ironixRequerirPermiso("documentacion", "ver");


require_once __DIR__ . "/../conexion.php";

date_default_timezone_set("America/Santiago");

$conn->set_charset("utf8mb4");


/* =========================
   VARIABLES DE CONTROL
========================= */

$httpCode = 500;


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
        throw new Exception("Error al consultar versión del Gantt: " . $conn->error);
    }

    if ($resultado->num_rows === 0) {
        $httpCode = 404;
        throw new Exception("No existe versión registrada para gantt_maquinas.");
    }

    $fila = $resultado->fetch_assoc();

    $conn->close();

    ironixResponderJson([
        "success" => true,
        "modulo" => $fila["modulo"],
        "version" => intval($fila["version"]),
        "actualizado_en" => $fila["actualizado_en"]
    ], 200);

} catch (Throwable $e) {

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => $e->getMessage()
    ], $httpCode);
}