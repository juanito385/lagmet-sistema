<?php

/* =========================
   IRONIX - GUARD GENERAL
========================= */

/*
    Este archivo protege endpoints PHP.
    Si el usuario no tiene sesión activa, bloquea el acceso.
*/

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/session_config.php";

/* =========================
   VALIDAR SESIÓN ACTIVA
========================= */

if (!ironixValidarSesionActiva()) {
    ironixResponderNoAutorizado("Sesión no iniciada o expirada");
}


/* =========================
   USUARIO AUTENTICADO
========================= */

/*
    Variables disponibles para cualquier endpoint protegido.
    Ejemplo:
    $IRONIX_USER_ID
    $IRONIX_USER_NAME
    $IRONIX_USER_EMAIL
    $IRONIX_USER_ROLE
*/

$IRONIX_USER_ID = $_SESSION["ironix_usuario_id"];
$IRONIX_USER_NAME = $_SESSION["ironix_usuario_nombre"] ?? "";
$IRONIX_USER_EMAIL = $_SESSION["ironix_usuario_correo"] ?? "";
$IRONIX_USER_ROLE = $_SESSION["ironix_usuario_rol"] ?? "usuario";

?>