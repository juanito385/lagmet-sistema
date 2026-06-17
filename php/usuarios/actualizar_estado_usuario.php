<?php

/* =========================
   IRONIX - CAMBIAR ESTADO DE USUARIO
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("POST");
ironixRequerirPermiso("configuracion", "seguridad");


/* =========================
   ADMIN AUTENTICADO
========================= */

/*
    Seguridad Fase 4:
    No se recibe admin_id desde frontend.
    Se usa el usuario autenticado por guard.php.
*/

$adminId = intval($IRONIX_USER_ID ?? ($_SESSION["ironix_usuario_id"] ?? 0));

if ($adminId <= 0) {
    ironixResponderNoAutorizado("Administrador autenticado no válido");
}


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

$usuarioId = isset($input["usuario_id"]) ? intval($input["usuario_id"]) : 0;
$estado = isset($input["estado"]) ? trim((string) $input["estado"]) : "";

$estadosPermitidos = ["activa", "inactiva", "bloqueada"];


/* =========================
   VALIDACIONES
========================= */

if ($usuarioId <= 0) {
    ironixResponderJson([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ], 400);
}

if (!in_array($estado, $estadosPermitidos, true)) {
    ironixResponderJson([
        "success" => false,
        "message" => "Estado no válido"
    ], 400);
}


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


try {

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
        throw new Exception("Error al validar usuario: " . $conn->error);
    }

    $stmtUsuario->bind_param("i", $usuarioId);

    if (!$stmtUsuario->execute()) {
        throw new Exception("Error al ejecutar validación de usuario: " . $stmtUsuario->error);
    }

    $resultUsuario = $stmtUsuario->get_result();

    if (!$resultUsuario || $resultUsuario->num_rows === 0) {
        $stmtUsuario->close();
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "Usuario no encontrado"
        ], 404);
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
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "No puedes bloquear o desactivar tu propia cuenta"
        ], 403);
    }

    /*
        Protección:
        Se mantiene tu regla actual: no permitir bloquear o desactivar administradores.
    */

    if (($usuario["rol"] ?? "") === "admin" && $estado !== "activa") {
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "No se puede bloquear o desactivar un administrador"
        ], 403);
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
        throw new Exception("Error al preparar actualización: " . $conn->error);
    }

    $stmtUpdate->bind_param("si", $estado, $usuarioId);

    if (!$stmtUpdate->execute()) {
        throw new Exception("Error al actualizar estado del usuario: " . $stmtUpdate->error);
    }

    $stmtUpdate->close();


    /* =========================
       ACTUALIZAR SESIÓN SI EL ADMIN SE MODIFICÓ A SÍ MISMO
    ========================= */

    if ($adminId === $usuarioId) {
        $_SESSION["ironix_usuario_estado"] = $estado;
    }


    /* =========================
       RESPUESTA
    ========================= */

    $conn->close();

    ironixResponderJson([
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
    ], 200);

} catch (Throwable $e) {

    if (isset($stmtUsuario) && $stmtUsuario instanceof mysqli_stmt) {
        $stmtUsuario->close();
    }

    if (isset($stmtUpdate) && $stmtUpdate instanceof mysqli_stmt) {
        $stmtUpdate->close();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => $e->getMessage()
    ], 500);
}