<?php

/* ==================================================
   PERFIL - ACTUALIZAR USUARIO
   Ruta: php/perfil/actualizar_usuario.php
================================================== */

require_once __DIR__ . "/../core/request.php";
require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("perfil", "editar");


require_once __DIR__ . "/../conexion.php";


/* =========================
   VALIDAR MÉTODO
========================= */

validarMetodo("POST");


/* =========================
   RECIBIR DATOS BASE
========================= */

$idSesion = intval($IRONIX_USER_ID);
$idSolicitado = intval(obtenerPost("usuario_id", 0));

$nombre = trim((string) obtenerPost("nombre", ""));
$correo = trim((string) obtenerPost("correo", ""));


/* =========================
   VALIDACIONES BASE
========================= */

if ($idSesion <= 0) {
    responderError("Sesión inválida", 401);
}

if ($idSolicitado <= 0) {
    responderError("ID de usuario no recibido", 422);
}

/*
    Seguridad Fase 3:
    El usuario solo puede actualizar su propio perfil.
*/
if ($idSolicitado !== $idSesion) {
    responderError("No tienes permisos para actualizar este perfil", 403);
}

$id = $idSesion;

if ($nombre === "" || $correo === "") {
    responderError("Completa nombre y correo", 422);
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    responderError("Correo electrónico no válido", 422);
}


/* =========================
   CAMPOS OPCIONALES PERFIL
========================= */

$tieneTelefono = array_key_exists("telefono", $_POST);
$tieneArea = array_key_exists("area", $_POST);
$tieneIdioma = array_key_exists("idioma", $_POST);

/*
    Seguridad:
    El estado NO se actualiza desde Perfil.
    El estado de cuenta se controla desde Configuración / Seguridad.
*/
if (array_key_exists("estado", $_POST)) {
    responderError("No puedes modificar el estado de cuenta desde Perfil", 403);
}

$telefono = $tieneTelefono ? trim((string) $_POST["telefono"]) : null;
$area = $tieneArea ? trim((string) $_POST["area"]) : null;
$idioma = $tieneIdioma ? trim((string) $_POST["idioma"]) : null;

if ($tieneArea && $area === "") {
    responderError("El área no puede quedar vacía", 422);
}

if ($tieneIdioma && $idioma === "") {
    responderError("El idioma no puede quedar vacío", 422);
}


/* =========================
   VALIDAR EXISTENCIA USUARIO
========================= */

$sqlExiste = "
    SELECT 
        id,
        estado
    FROM usuarios
    WHERE id = ?
    LIMIT 1
";

$stmtExiste = $conn->prepare($sqlExiste);

if (!$stmtExiste) {
    responderError("Error al preparar validación de usuario", 500);
}

$stmtExiste->bind_param("i", $id);

if (!$stmtExiste->execute()) {
    $stmtExiste->close();
    $conn->close();

    responderError("Error al ejecutar validación de usuario", 500);
}

$resultExiste = $stmtExiste->get_result();

if (!$resultExiste || $resultExiste->num_rows === 0) {
    $stmtExiste->close();
    $conn->close();

    responderError("Usuario no encontrado", 404);
}

$usuarioActual = $resultExiste->fetch_assoc();
$stmtExiste->close();

if ($usuarioActual["estado"] !== "activa") {
    $conn->close();

    responderError("La cuenta no está activa", 403);
}


/* =========================
   VALIDAR CORREO DUPLICADO
========================= */

$sqlCorreo = "
    SELECT id 
    FROM usuarios 
    WHERE correo = ? 
    AND id <> ?
    LIMIT 1
";

$stmtCorreo = $conn->prepare($sqlCorreo);

if (!$stmtCorreo) {
    responderError("Error al validar correo", 500);
}

$stmtCorreo->bind_param("si", $correo, $id);

if (!$stmtCorreo->execute()) {
    $stmtCorreo->close();
    $conn->close();

    responderError("Error al ejecutar validación de correo", 500);
}

$resultCorreo = $stmtCorreo->get_result();

if ($resultCorreo && $resultCorreo->num_rows > 0) {
    $stmtCorreo->close();
    $conn->close();

    responderError("El correo ya está registrado por otro usuario", 409);
}

$stmtCorreo->close();


/* =========================
   CONSTRUIR UPDATE DINÁMICO
========================= */

$campos = [
    "nombre = ?",
    "correo = ?"
];

$tipos = "ss";
$valores = [$nombre, $correo];

if ($tieneTelefono) {
    $campos[] = "telefono = ?";
    $tipos .= "s";
    $valores[] = $telefono;
}

if ($tieneArea) {
    $campos[] = "area = ?";
    $tipos .= "s";
    $valores[] = $area;
}

if ($tieneIdioma) {
    $campos[] = "idioma = ?";
    $tipos .= "s";
    $valores[] = $idioma;
}

$tipos .= "i";
$valores[] = $id;

$sql = "
    UPDATE usuarios 
    SET " . implode(", ", $campos) . "
    WHERE id = ?
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    responderError("Error al preparar actualización", 500);
}

$stmt->bind_param($tipos, ...$valores);

if (!$stmt->execute()) {
    $stmt->close();
    $conn->close();

    responderError("Error al actualizar usuario", 500);
}

$stmt->close();


/* =========================
   DEVOLVER USUARIO ACTUALIZADO
========================= */

$sqlUsuario = "
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

$stmtUsuario = $conn->prepare($sqlUsuario);

if (!$stmtUsuario) {
    $conn->close();

    responderJSON([
        "success" => true,
        "message" => "Datos actualizados correctamente",
        "usuario" => null
    ]);
}

$stmtUsuario->bind_param("i", $id);

if (!$stmtUsuario->execute()) {
    $stmtUsuario->close();
    $conn->close();

    responderJSON([
        "success" => true,
        "message" => "Datos actualizados correctamente",
        "usuario" => null
    ]);
}

$resultUsuario = $stmtUsuario->get_result();
$usuario = $resultUsuario ? $resultUsuario->fetch_assoc() : null;

$stmtUsuario->close();
$conn->close();

responderJSON([
    "success" => true,
    "message" => "Datos actualizados correctamente",
    "usuario" => $usuario
]);