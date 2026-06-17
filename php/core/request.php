<?php

/* ==================================================
   IRONIX - CORE REQUEST
   Funciones comunes para validar solicitudes.

   Ruta: php/core/request.php
================================================== */

require_once __DIR__ . "/response.php";


/* =========================
   VALIDAR MÉTODO HTTP
========================= */

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


/* =========================
   OBTENER POST
========================= */

if (!function_exists("obtenerPost")) {
    function obtenerPost(string $campo, $valorPorDefecto = null)
    {
        return $_POST[$campo] ?? $valorPorDefecto;
    }
}


/* =========================
   OBTENER GET
========================= */

if (!function_exists("obtenerGet")) {
    function obtenerGet(string $campo, $valorPorDefecto = null)
    {
        return $_GET[$campo] ?? $valorPorDefecto;
    }
}


/* =========================
   OBTENER JSON
========================= */

if (!function_exists("obtenerJson")) {
    function obtenerJson(): array
    {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);

        return is_array($data) ? $data : [];
    }
}


/* =========================
   OBTENER CAMPO DESDE JSON
========================= */

if (!function_exists("obtenerJsonCampo")) {
    function obtenerJsonCampo(string $campo, $valorPorDefecto = null)
    {
        $data = obtenerJson();

        return $data[$campo] ?? $valorPorDefecto;
    }
}


/* =========================
   CAMPO REQUERIDO
========================= */

if (!function_exists("campoRequerido")) {
    function campoRequerido($valor, string $nombreCampo): void
    {
        if ($valor === null || trim((string)$valor) === "") {
            responderError("El campo {$nombreCampo} es obligatorio", 422);
        }
    }
}