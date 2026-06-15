<?php

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

require_once __DIR__ . "/session_config.php";

/* ===============================
   VALIDAR SESIÓN ACTIVA
================================ */

if (!ironixValidarSesionActiva()) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => "Sesión no iniciada o expirada"
    ]);

    exit;
}

/* ===============================
   RESPUESTA SESIÓN VÁLIDA
================================ */

echo json_encode([
    "success" => true,
    "auth" => true,
    "message" => "Sesión activa",
    "user" => [
        "id" => $_SESSION["ironix_usuario_id"],
        "nombre" => $_SESSION["ironix_usuario_nombre"] ?? "Usuario",
        "correo" => $_SESSION["ironix_usuario_correo"] ?? "",
        "email" => $_SESSION["ironix_usuario_correo"] ?? "",
        "rol" => $_SESSION["ironix_usuario_rol"] ?? "usuario"
    ]
]);

exit;

?>