<?php

/* =========================
   IRONIX - CAMBIAR ESTADO DE USUARIO
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("configuracion", "seguridad");


require_once __DIR__ . "/../conexion.php";


/* =========================
   VALIDAR MÉTODO
========================= */

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* =========================
   ADMIN AUTENTICADO
========================= */

/*
    Seguridad Fase 3:
    No se recibe admin_id desde frontend.
    Se usa el usuario autenticado por guard.php.
*/

$adminId = intval($IRONIX_USER_ID);


/* =========================
   RECIBIR DATOS
========================= */

$usuarioId = isset($_POST["usuario_id"]) ? intval($_POST["usuario_id"]) : 0;
$estado = isset($_POST["estado"]) ? trim($_POST["estado"]) : "";

$estadosPermitidos = ["activa", "inactiva", "bloqueada"];


/* =========================
   VALIDACIONES
========================= */

if ($adminId <= 0) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Administrador autenticado no válido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($usuarioId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (!in_array($estado, $estadosPermitidos, true)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Estado no válido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* =========================
   VALIDAR USUARIO OBJETIVO
========================= */

$sqlUsuario = "
    SELECT 
        id, 
        nombre, 
        correo, 
        rol, 
        estado
    FROM usuarios
    WHERE id = ?
    LIMIT 1
";

$stmtUsuario = $conn->prepare($sqlUsuario);

if (!$stmtUsuario) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al validar usuario"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtUsuario->bind_param("i", $usuarioId);

if (!$stmtUsuario->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al ejecutar validación de usuario"
    ], JSON_UNESCAPED_UNICODE);

    $stmtUsuario->close();
    $conn->close();
    exit;
}

$resultUsuario = $stmtUsuario->get_result();

if (!$resultUsuario || $resultUsuario->num_rows === 0) {
    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado"
    ], JSON_UNESCAPED_UNICODE);

    $stmtUsuario->close();
    $conn->close();
    exit;
}

$usuario = $resultUsuario->fetch_assoc();
$stmtUsuario->close();


/* =========================
   PROTECCIONES DE SEGURIDAD
========================= */

/*
    Protección:
    El administrador no puede bloquearse o desactivarse a sí mismo.
*/

if ($adminId === $usuarioId && $estado !== "activa") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "No puedes bloquear o desactivar tu propia cuenta"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

/*
    Protección:
    Mantengo tu regla actual: no permitir bloquear o desactivar administradores.
*/

if ($usuario["rol"] === "admin" && $estado !== "activa") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "No se puede bloquear o desactivar un administrador"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}


/* =========================
   ACTUALIZAR ESTADO
========================= */

$sqlUpdate = "
    UPDATE usuarios
    SET estado = ?
    WHERE id = ?
";

$stmtUpdate = $conn->prepare($sqlUpdate);

if (!$stmtUpdate) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al preparar actualización"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtUpdate->bind_param("si", $estado, $usuarioId);

if (!$stmtUpdate->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar estado del usuario"
    ], JSON_UNESCAPED_UNICODE);

    $stmtUpdate->close();
    $conn->close();
    exit;
}

$stmtUpdate->close();


/* =========================
   RESPUESTA
========================= */

echo json_encode([
    "success" => true,
    "message" => "Estado del usuario actualizado correctamente",
    "usuario" => [
        "id" => intval($usuario["id"]),
        "nombre" => $usuario["nombre"],
        "correo" => $usuario["correo"],
        "rol" => $usuario["rol"],
        "estado_anterior" => $usuario["estado"],
        "estado" => $estado
    ]
], JSON_UNESCAPED_UNICODE);

$conn->close();