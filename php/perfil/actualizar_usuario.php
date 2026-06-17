<?php

/* ==================================================
   IRONIX - PERFIL - ACTUALIZAR USUARIO
   Ruta: php/perfil/actualizar_usuario.php
================================================== */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("POST");
ironixRequerirPermiso("perfil", "editar");


/* =========================
   RECIBIR DATOS
========================= */

/*
    Compatible con:
    - JSON enviado por fetch
    - FormData / POST tradicional
*/

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    $input = $_POST;
}


/* =========================
   DATOS BASE
========================= */

$idSesion = intval($IRONIX_USER_ID ?? ($_SESSION["ironix_usuario_id"] ?? 0));
$idSolicitado = intval($input["usuario_id"] ?? 0);

$nombre = trim((string) ($input["nombre"] ?? ""));
$correo = trim((string) ($input["correo"] ?? ""));


/* =========================
   VALIDACIONES BASE
========================= */

if ($idSesion <= 0) {
    ironixResponderNoAutorizado("Sesión inválida");
}

if ($idSolicitado <= 0) {
    ironixResponderJson([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ], 422);
}

/*
    Seguridad Fase 4:
    El usuario solo puede actualizar su propio perfil.
*/
if ($idSolicitado !== $idSesion) {
    ironixResponderJson([
        "success" => false,
        "message" => "No tienes permisos para actualizar este perfil"
    ], 403);
}

$id = $idSesion;

if ($nombre === "" || $correo === "") {
    ironixResponderJson([
        "success" => false,
        "message" => "Completa nombre y correo"
    ], 422);
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    ironixResponderJson([
        "success" => false,
        "message" => "Correo electrónico no válido"
    ], 422);
}


/* =========================
   CAMPOS OPCIONALES PERFIL
========================= */

$tieneTelefono = array_key_exists("telefono", $input);
$tieneArea = array_key_exists("area", $input);
$tieneIdioma = array_key_exists("idioma", $input);

/*
    Seguridad:
    El estado NO se actualiza desde Perfil.
    El estado de cuenta se controla desde Configuración / Seguridad.
*/
if (array_key_exists("estado", $input)) {
    ironixResponderJson([
        "success" => false,
        "message" => "No puedes modificar el estado de cuenta desde Perfil"
    ], 403);
}

$telefono = $tieneTelefono ? trim((string) $input["telefono"]) : null;
$area = $tieneArea ? trim((string) $input["area"]) : null;
$idioma = $tieneIdioma ? trim((string) $input["idioma"]) : null;

if ($tieneTelefono && $telefono === "") {
    $telefono = null;
}

if ($tieneArea && $area === "") {
    ironixResponderJson([
        "success" => false,
        "message" => "El área no puede quedar vacía"
    ], 422);
}

if ($tieneIdioma && $idioma === "") {
    ironixResponderJson([
        "success" => false,
        "message" => "El idioma no puede quedar vacío"
    ], 422);
}


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


try {

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
        throw new Exception("Error al preparar validación de usuario: " . $conn->error);
    }

    $stmtExiste->bind_param("i", $id);

    if (!$stmtExiste->execute()) {
        throw new Exception("Error al ejecutar validación de usuario: " . $stmtExiste->error);
    }

    $resultExiste = $stmtExiste->get_result();

    if (!$resultExiste || $resultExiste->num_rows === 0) {
        $stmtExiste->close();
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "Usuario no encontrado"
        ], 404);
    }

    $usuarioActual = $resultExiste->fetch_assoc();
    $stmtExiste->close();

    if (($usuarioActual["estado"] ?? "") !== "activa") {
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "La cuenta no está activa"
        ], 403);
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
        throw new Exception("Error al validar correo: " . $conn->error);
    }

    $stmtCorreo->bind_param("si", $correo, $id);

    if (!$stmtCorreo->execute()) {
        throw new Exception("Error al ejecutar validación de correo: " . $stmtCorreo->error);
    }

    $resultCorreo = $stmtCorreo->get_result();

    if ($resultCorreo && $resultCorreo->num_rows > 0) {
        $stmtCorreo->close();
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "El correo ya está registrado por otro usuario"
        ], 409);
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
        throw new Exception("Error al preparar actualización: " . $conn->error);
    }

    $stmt->bind_param($tipos, ...$valores);

    if (!$stmt->execute()) {
        throw new Exception("Error al actualizar usuario: " . $stmt->error);
    }

    $stmt->close();


    /* =========================
       ACTUALIZAR DATOS DE SESIÓN
    ========================= */

    $_SESSION["ironix_usuario_nombre"] = $nombre;
    $_SESSION["ironix_usuario_correo"] = $correo;


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

        ironixResponderJson([
            "success" => true,
            "message" => "Datos actualizados correctamente",
            "usuario" => null
        ], 200);
    }

    $stmtUsuario->bind_param("i", $id);

    if (!$stmtUsuario->execute()) {
        $stmtUsuario->close();
        $conn->close();

        ironixResponderJson([
            "success" => true,
            "message" => "Datos actualizados correctamente",
            "usuario" => null
        ], 200);
    }

    $resultUsuario = $stmtUsuario->get_result();
    $usuario = $resultUsuario ? $resultUsuario->fetch_assoc() : null;

    $stmtUsuario->close();
    $conn->close();

    ironixResponderJson([
        "success" => true,
        "message" => "Datos actualizados correctamente",
        "usuario" => $usuario
    ], 200);

} catch (Throwable $e) {

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => $e->getMessage()
    ], 500);
}