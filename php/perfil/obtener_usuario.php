<?php

/* ==================================================
   IRONIX - PERFIL - OBTENER USUARIO
   Ruta: php/perfil/obtener_usuario.php
================================================== */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("GET");
ironixRequerirPermiso("perfil", "ver");


/* =========================
   OBTENER ID USUARIO
========================= */

/*
    Seguridad Fase 4:
    El perfil solo puede consultar el usuario autenticado.
    No se permite consultar perfiles ajenos manipulando usuario_id.
*/

$idSesion = intval($IRONIX_USER_ID ?? ($_SESSION["ironix_usuario_id"] ?? 0));
$idSolicitado = intval($_GET["usuario_id"] ?? 0);

if ($idSesion <= 0) {
    ironixResponderNoAutorizado("Sesión inválida");
}

if ($idSolicitado <= 0) {
    ironixResponderJson([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ], 422);
}

if ($idSolicitado !== $idSesion) {
    ironixResponderJson([
        "success" => false,
        "message" => "No tienes permisos para consultar este perfil"
    ], 403);
}

$id = $idSesion;


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


/* =========================
   CONSULTAR USUARIO
========================= */

$sql = "
    SELECT 
        id, 
        nombre, 
        correo, 
        rol,
        telefono,
        area,
        idioma,
        estado,
        fecha_creacion
    FROM usuarios 
    WHERE id = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    $error = $conn->error;
    $conn->close();

    ironixResponderJson([
        "success" => false,
        "message" => "Error al preparar consulta",
        "error" => $error
    ], 500);
}

$stmt->bind_param("i", $id);

if (!$stmt->execute()) {
    $error = $stmt->error;

    $stmt->close();
    $conn->close();

    ironixResponderJson([
        "success" => false,
        "message" => "Error al ejecutar consulta",
        "error" => $error
    ], 500);
}

$result = $stmt->get_result();

if ($result && $result->num_rows > 0) {
    $usuario = $result->fetch_assoc();

    $stmt->close();
    $conn->close();

    ironixResponderJson([
        "success" => true,
        "usuario" => $usuario
    ], 200);
}

$stmt->close();
$conn->close();

ironixResponderJson([
    "success" => false,
    "message" => "Usuario no encontrado"
], 404);