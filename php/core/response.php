<?php

/* ==================================================
   IRONIX - CORE RESPONSE
   Funciones estándar para respuestas JSON.

   Ruta: php/core/response.php
================================================== */

if (!function_exists("responderJSON")) {
    function responderJSON(array $payload, int $codigoHttp = 200): void
    {
        http_response_code($codigoHttp);
        header("Content-Type: application/json; charset=utf-8");

        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if (!function_exists("responderOK")) {
    function responderOK(array $data = [], string $message = "Operación realizada correctamente", int $codigoHttp = 200): void
    {
        responderJSON([
            "success" => true,
            "message" => $message,
            "data" => $data
        ], $codigoHttp);
    }
}

if (!function_exists("responderError")) {
    function responderError(string $message = "Error al procesar la solicitud", int $codigoHttp = 400, array $extra = []): void
    {
        responderJSON(array_merge([
            "success" => false,
            "message" => $message
        ], $extra), $codigoHttp);
    }
}