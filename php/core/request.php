<?php

/* ==================================================
   IRONIX - CORE REQUEST
   Funciones comunes para validar solicitudes.

   Ruta: php/core/request.php
================================================== */

require_once __DIR__ . "/response.php";

if (!function_exists("validarMetodo")) {
    function validarMetodo(string $metodoEsperado): void
    {
        $metodoActual = $_SERVER["REQUEST_METHOD"] ?? "";

        if (strtoupper($metodoActual) !== strtoupper($metodoEsperado)) {
            responderError("Método no permitido", 405, [
                "metodo_recibido" => $metodoActual,
                "metodo_esperado" => strtoupper($metodoEsperado)
            ]);
        }
    }
}

if (!function_exists("obtenerPost")) {
    function obtenerPost(string $campo, $valorPorDefecto = null)
    {
        return $_POST[$campo] ?? $valorPorDefecto;
    }
}

if (!function_exists("obtenerGet")) {
    function obtenerGet(string $campo, $valorPorDefecto = null)
    {
        return $_GET[$campo] ?? $valorPorDefecto;
    }
}

if (!function_exists("campoRequerido")) {
    function campoRequerido($valor, string $nombreCampo): void
    {
        if ($valor === null || trim((string)$valor) === "") {
            responderError("El campo {$nombreCampo} es obligatorio", 422);
        }
    }
}