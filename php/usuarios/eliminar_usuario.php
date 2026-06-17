<?php

/* =========================
   IRONIX - ELIMINAR USUARIO
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("POST");
ironixRequerirPermiso("configuracion", "eliminar_usuario");


/* =========================
   USUARIO ADMIN AUTENTICADO
========================= */

/*
    Seguridad Fase 4:
    No se recibe admin_id desde el frontend.
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


/* =========================
   VALIDACIONES BÁSICAS
========================= */

if ($usuarioId <= 0) {
    ironixResponderJson([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ], 400);
}

if ($adminId === $usuarioId) {
    ironixResponderJson([
        "success" => false,
        "message" => "No puedes eliminar tu propia cuenta"
    ], 403);
}


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");

$transaccionIniciada = false;


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
        throw new Exception("Error al preparar validación de usuario: " . $conn->error);
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
       PROTEGER ÚLTIMO ADMIN ACTIVO
    ========================= */

    if (($usuario["rol"] ?? "") === "admin" && ($usuario["estado"] ?? "") === "activa") {
        $sqlAdminsActivos = "
            SELECT COUNT(*) AS total
            FROM usuarios
            WHERE rol = 'admin'
            AND estado = 'activa'
            AND id <> ?
        ";

        $stmtAdmins = $conn->prepare($sqlAdminsActivos);

        if (!$stmtAdmins) {
            throw new Exception("Error al validar administradores activos: " . $conn->error);
        }

        $stmtAdmins->bind_param("i", $usuarioId);

        if (!$stmtAdmins->execute()) {
            throw new Exception("Error al ejecutar validación de administradores activos: " . $stmtAdmins->error);
        }

        $resultAdmins = $stmtAdmins->get_result();
        $rowAdmins = $resultAdmins ? $resultAdmins->fetch_assoc() : null;

        $totalAdminsActivos = intval($rowAdmins["total"] ?? 0);

        $stmtAdmins->close();

        if ($totalAdminsActivos <= 0) {
            $conn->close();

            ironixResponderJson([
                "success" => false,
                "message" => "No puedes eliminar el último administrador activo del sistema"
            ], 403);
        }
    }


    /* =========================
       ELIMINAR USUARIO
    ========================= */

    $conn->begin_transaction();
    $transaccionIniciada = true;


    /* =========================
       ELIMINAR PERMISOS ASOCIADOS
    ========================= */

    $sqlDeletePermisos = "
        DELETE FROM usuario_permisos
        WHERE usuario_id = ?
    ";

    $stmtPermisos = $conn->prepare($sqlDeletePermisos);

    if (!$stmtPermisos) {
        throw new Exception("Error al preparar eliminación de permisos: " . $conn->error);
    }

    $stmtPermisos->bind_param("i", $usuarioId);

    if (!$stmtPermisos->execute()) {
        throw new Exception("Error al eliminar permisos del usuario: " . $stmtPermisos->error);
    }

    $stmtPermisos->close();


    /* =========================
       ELIMINAR USUARIO
    ========================= */

    $sqlDeleteUsuario = "
        DELETE FROM usuarios
        WHERE id = ?
        LIMIT 1
    ";

    $stmtDelete = $conn->prepare($sqlDeleteUsuario);

    if (!$stmtDelete) {
        throw new Exception("Error al preparar eliminación de usuario: " . $conn->error);
    }

    $stmtDelete->bind_param("i", $usuarioId);

    if (!$stmtDelete->execute()) {
        throw new Exception("Error al eliminar usuario: " . $stmtDelete->error);
    }

    if ($stmtDelete->affected_rows <= 0) {
        throw new Exception("No se eliminó ningún usuario");
    }

    $stmtDelete->close();


    /* =========================
       CONFIRMAR TRANSACCIÓN
    ========================= */

    $conn->commit();
    $transaccionIniciada = false;

    $conn->close();

    ironixResponderJson([
        "success" => true,
        "message" => "Usuario eliminado correctamente",
        "usuario" => [
            "id" => intval($usuario["id"]),
            "nombre" => $usuario["nombre"],
            "correo" => $usuario["correo"],
            "rol" => $usuario["rol"],
            "estado" => $usuario["estado"]
        ]
    ], 200);

} catch (Throwable $e) {

    if ($transaccionIniciada && isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => $e->getMessage()
    ], 500);
}