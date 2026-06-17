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
    function validarMetodo($metodosEsperados): void
    {
        if (!is_array($metodosEsperados)) {
            $metodosEsperados = [$metodosEsperados];
        }

        $metodoActual = strtoupper($_SERVER["REQUEST_METHOD"] ?? "");

        $metodosNormalizados = array_map(function ($metodo) {
            return strtoupper(trim((string) $metodo));
        }, $metodosEsperados);

        if (!in_array($metodoActual, $metodosNormalizados, true)) {
            responderError("Método no permitido", 405, [
                "metodo_recibido" => $metodoActual,
                "metodos_permitidos" => $metodosNormalizados
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
        static $jsonCache = null;

        if ($jsonCache !== null) {
            return $jsonCache;
        }

        $raw = file_get_contents("php://input");

        if ($raw === false || trim($raw) === "") {
            $jsonCache = [];
            return $jsonCache;
        }

        $data = json_decode($raw, true);

        $jsonCache = is_array($data) ? $data : [];

        return $jsonCache;
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
   OBTENER INPUT GENERAL
========================= */

if (!function_exists("obtenerInput")) {
    function obtenerInput(): array
    {
        $json = obtenerJson();

        if (!empty($json)) {
            return $json;
        }

        return $_POST;
    }
}


/* =========================
   OBTENER CAMPO DESDE INPUT GENERAL
========================= */

if (!function_exists("obtenerInputCampo")) {
    function obtenerInputCampo(string $campo, $valorPorDefecto = null)
    {
        $input = obtenerInput();

        return $input[$campo] ?? $valorPorDefecto;
    }
}


/* =========================
   CAMPO REQUERIDO
========================= */

if (!function_exists("campoRequerido")) {
    function campoRequerido($valor, string $nombreCampo): void
    {
        if ($valor === null || trim((string) $valor) === "") {
            responderError("El campo {$nombreCampo} es obligatorio", 422);
        }
    }
}