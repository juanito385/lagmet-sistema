<?php

/* =========================
   IRONIX - LOGOUT
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/session_config.php";


/* =========================
   CERRAR SESIÓN PHP
========================= */

ironixCerrarSesion();


/* =========================
   RESPUESTA
========================= */

echo json_encode([
    "success" => true,
    "message" => "Sesión cerrada correctamente"
]);

?>