<?php

/* ==================================================
   IRONIX - CORE RESPONSE
   Funciones estándar para respuestas JSON.

   Ruta: php/core/response.php
================================================== */

/*
    Nota Fase 4:
    Este archivo queda como helper auxiliar / legacy.

    Los endpoints nuevos protegidos por guard.php usan:
    - ironixResponderJson()
    - ironixResponderNoAutorizado()
    - ironixResponderSinPermisos()

    Este archivo se mantiene para compatibilidad con archivos
    antiguos que todavía usen responderJSON(), responderOK()
    o responderError().
*/


/* =========================
   APLICAR HEADERS JSON
========================= */

if (!function_exists("aplicarHeadersJson")) {
    function aplicarHeadersJson(): void
    {
        if (!headers_sent()) {
            header("Content-Type: application/json; charset=utf-8");
            header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
            header("Pragma: no-cache");
        }
    }
}


/* =========================
   RESPUESTA JSON GENERAL
========================= */

if (!function_exists("responderJSON")) {
    function responderJSON(array $payload, int $codigoHttp = 200): void
    {
        aplicarHeadersJson();
        http_response_code($codigoHttp);

        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }
}


/* =========================
   RESPUESTA OK
========================= */

if (!function_exists("responderOK")) {
    function responderOK(
        array $data = [],
        string $message = "Operación realizada correctamente",
        int $codigoHttp = 200
    ): void {
        responderJSON([
            "success" => true,
            "message" => $message,
            "data" => $data
        ], $codigoHttp);
    }
}


/* =========================
   RESPUESTA ERROR
========================= */

if (!function_exists("responderError")) {
    function responderError(
        string $message = "Error al procesar la solicitud",
        int $codigoHttp = 400,
        array $extra = []
    ): void {
        responderJSON(array_merge([
            "success" => false,
            "message" => $message
        ], $extra), $codigoHttp);
    }
}


/* =========================
   RESPUESTA NO AUTORIZADA
========================= */

if (!function_exists("responderNoAutorizado")) {
    function responderNoAutorizado(string $message = "No autorizado"): void
    {
        responderJSON([
            "success" => false,
            "auth" => false,
            "message" => $message
        ], 401);
    }
}


/* =========================
   RESPUESTA SIN PERMISOS
========================= */

if (!function_exists("responderSinPermisos")) {
    function responderSinPermisos(string $message = "No tienes permisos para realizar esta acción"): void
    {
        responderJSON([
            "success" => false,
            "auth" => true,
            "permission" => false,
            "permiso" => false,
            "message" => $message
        ], 403);
    }
}