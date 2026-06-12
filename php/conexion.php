<?php

$config = require __DIR__ . "/config/env.php";

$conexion = new mysqli(
    $config["DB_HOST"],
    $config["DB_USER"],
    $config["DB_PASS"],
    $config["DB_NAME"]
);

if ($conexion->connect_error) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error de conexión a la base de datos"
    ]);

    exit;
}

$conexion->set_charset("utf8mb4");