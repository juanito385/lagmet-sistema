<?php

/* ===============================
   IRONIX - LOGOUT
================================ */

require_once __DIR__ . "/session_config.php";


/* ===============================
   HEADERS JSON / NO CACHE
================================ */

if (function_exists("ironixAplicarHeadersJson")) {
    ironixAplicarHeadersJson();
} else {
    header("Content-Type: application/json; charset=utf-8");
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    header("Pragma: no-cache");
}


/* ===============================
   VALIDAR MÉTODO
================================ */

if (function_exists("ironixRequerirMetodo")) {
    ironixRequerirMetodo("POST");
} else {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);

        echo json_encode([
            "success" => false,
            "message" => "Método no permitido"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }
}


/* ===============================
   CERRAR SESIÓN IRONIX
================================ */

ironixCerrarSesion();


/* ===============================
   RESPUESTA
================================ */

if (function_exists("ironixResponderJson")) {
    ironixResponderJson([
        "success" => true,
        "message" => "Sesión cerrada correctamente"
    ], 200);
}

echo json_encode([
    "success" => true,
    "message" => "Sesión cerrada correctamente"
], JSON_UNESCAPED_UNICODE);

exit;