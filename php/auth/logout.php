<?php

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

require_once __DIR__ . "/session_config.php";

/* ===============================
   CERRAR SESIÓN IRONIX
================================ */

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

ironixCerrarSesion();

echo json_encode([
    "success" => true,
    "message" => "Sesión cerrada correctamente"
]);

exit;

?>