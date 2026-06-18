<?php

/* ===============================
   IRONIX - LOGOUT
================================ */

require_once __DIR__ . "/session_config.php";


/* ===============================
   HEADERS JSON / NO CACHE
================================ */

ironixAplicarHeadersJson();


/* ===============================
   VALIDAR MÉTODO
================================ */

ironixRequerirMetodo("POST");


/* ===============================
   CERRAR SESIÓN IRONIX
================================ */

ironixCerrarSesion();


/* ===============================
   RESPUESTA
================================ */

ironixResponderJson([
    "success" => true,
    "message" => "Sesión cerrada correctamente"
], 200);