<?php

/* ==================================================
   IRONIX - CONEXIÓN BASE DE DATOS
   Ruta: php/conexion.php
================================================== */

$config = require __DIR__ . "/config/env.php";

$conexion = new mysqli(
    $config["DB_HOST"],
    $config["DB_USER"],
    $config["DB_PASS"],
    $config["DB_NAME"]
);

if ($conexion->connect_error) {
    http_response_code(500);
    header("Content-Type: application/json; charset=utf-8");

    echo json_encode([
        "success" => false,
        "message" => "Error de conexión a la base de datos"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$conexion->set_charset("utf8mb4");

/*
    Alias de compatibilidad:
    Algunos endpoints antiguos usan $conn
    y otros pueden usar $conexion.
*/
$conn = $conexion;