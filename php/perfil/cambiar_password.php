<?php

/* ==================================================
   PERFIL - CAMBIAR CONTRASEÑA
   Ruta: php/perfil/cambiar_password.php
================================================== */

require_once __DIR__ . "/../core/request.php";
require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("perfil", "cambiar_password");


require_once __DIR__ . "/../conexion.php";


/* =========================
   VALIDAR MÉTODO
========================= */

validarMetodo("POST");


/* =========================
   RECIBIR DATOS
========================= */

$idSesion = intval($IRONIX_USER_ID);
$idSolicitado = intval(obtenerPost("usuario_id", 0));

$actual = trim((string) obtenerPost("actual", ""));
$nueva = trim((string) obtenerPost("nueva", ""));
$confirmar = trim((string) obtenerPost("confirmar", ""));


/* =========================
   VALIDACIONES
========================= */

if ($idSesion <= 0) {
    responderError("Sesión inválida", 401);
}

if ($idSolicitado <= 0) {
    responderError("ID de usuario no recibido", 422);
}

/*
    Seguridad Fase 3:
    El usuario solo puede cambiar su propia contraseña.
*/
if ($idSolicitado !== $idSesion) {
    responderError("No tienes permisos para cambiar la contraseña de otro usuario", 403);
}

$id = $idSesion;

if ($actual === "" || $nueva === "" || $confirmar === "") {
    responderError("Completa todos los campos", 422);
}

if ($nueva !== $confirmar) {
    responderError("Las contraseñas no coinciden", 422);
}

if (strlen($nueva) < 6) {
    responderError("La nueva contraseña debe tener al menos 6 caracteres", 422);
}

if ($actual === $nueva) {
    responderError("La nueva contraseña debe ser distinta a la actual", 422);
}


/* =========================
   OBTENER CONTRASEÑA ACTUAL
========================= */

$sql = "
    SELECT 
        id,
        password 
    FROM usuarios 
    WHERE id = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    responderError("Error al preparar consulta", 500);
}

$stmt->bind_param("i", $id);

if (!$stmt->execute()) {
    $stmt->close();
    $conn->close();

    responderError("Error al ejecutar consulta", 500);
}

$result = $stmt->get_result();

if (!$result || $result->num_rows === 0) {
    $stmt->close();
    $conn->close();

    responderError("Usuario no encontrado", 404);
}

$usuario = $result->fetch_assoc();

$stmt->close();


/* =========================
   VALIDAR CONTRASEÑA ACTUAL
========================= */

/*
    Uso 422 en vez de 401 para evitar que el frontend interprete
    una contraseña incorrecta como sesión expirada.
*/

if (!password_verify($actual, $usuario["password"])) {
    $conn->close();

    responderError("Contraseña actual incorrecta", 422);
}


/* =========================
   ACTUALIZAR CONTRASEÑA
========================= */

$nuevaHash = password_hash($nueva, PASSWORD_DEFAULT);

$sqlUpdate = "
    UPDATE usuarios 
    SET password = ? 
    WHERE id = ?
";

$stmtUpdate = $conn->prepare($sqlUpdate);

if (!$stmtUpdate) {
    $conn->close();

    responderError("Error al preparar actualización", 500);
}

$stmtUpdate->bind_param("si", $nuevaHash, $id);

if (!$stmtUpdate->execute()) {
    $stmtUpdate->close();
    $conn->close();

    responderError("Error al actualizar contraseña", 500);
}

$stmtUpdate->close();
$conn->close();


/* =========================
   RESPUESTA
========================= */

responderJSON([
    "success" => true,
    "message" => "Contraseña actualizada correctamente"
]);