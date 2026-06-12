<?php

/* ==================================================
   PERFIL - ACTUALIZAR USUARIO
   Ruta: php/perfil/actualizar_usuario.php
================================================== */

require_once __DIR__ . "/../core/request.php";
require_once __DIR__ . "/../conexion.php";

/* =========================
   VALIDAR MÉTODO
========================= */

validarMetodo("POST");


/* =========================
   RECIBIR DATOS BASE
========================= */

$id = intval(obtenerPost("usuario_id", 0));
$nombre = trim((string) obtenerPost("nombre", ""));
$correo = trim((string) obtenerPost("correo", ""));

if ($id <= 0) {
    responderError("ID de usuario no recibido", 422);
}

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
$tieneEstado = array_key_exists("estado", $_POST);

$telefono = $tieneTelefono ? trim((string) $_POST["telefono"]) : null;
$area = $tieneArea ? trim((string) $_POST["area"]) : null;
$idioma = $tieneIdioma ? trim((string) $_POST["idioma"]) : null;
$estado = $tieneEstado ? trim((string) $_POST["estado"]) : null;

if ($tieneArea && $area === "") {
    responderError("El área no puede quedar vacía", 422);
}

if ($tieneIdioma && $idioma === "") {
    responderError("El idioma no puede quedar vacío", 422);
}

if ($tieneEstado && !in_array($estado, ["activa", "inactiva", "bloqueada"], true)) {
    responderError("Estado de cuenta no válido", 422);
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

if ($tieneEstado) {
    $campos[] = "estado = ?";
    $tipos .= "s";
    $valores[] = $estado;
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