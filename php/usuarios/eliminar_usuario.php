<?php

/* =========================
   IRONIX - ELIMINAR USUARIO
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("configuracion", "eliminar_usuario");


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
   USUARIO ADMIN AUTENTICADO
========================= */

/*
    Seguridad Fase 3:
    No se recibe admin_id desde el frontend.
    Se usa el usuario autenticado por guard.php.
*/

$adminId = intval($IRONIX_USER_ID);


/* =========================
   RECIBIR DATOS
========================= */

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    $input = $_POST;
}

$usuarioId = isset($input["usuario_id"]) ? intval($input["usuario_id"]) : 0;


/* =========================
   VALIDACIONES BÁSICAS
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

if ($adminId === $usuarioId) {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "No puedes eliminar tu propia cuenta"
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
        "message" => "Error al preparar validación de usuario"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtUsuario->bind_param("i", $usuarioId);
$stmtUsuario->execute();

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
   PROTEGER ÚLTIMO ADMIN ACTIVO
========================= */

if ($usuario["rol"] === "admin" && $usuario["estado"] === "activa") {
    $sqlAdminsActivos = "
        SELECT COUNT(*) AS total
        FROM usuarios
        WHERE rol = 'admin'
        AND estado = 'activa'
        AND id <> ?
    ";

    $stmtAdmins = $conn->prepare($sqlAdminsActivos);

    if (!$stmtAdmins) {
        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Error al validar administradores activos"
        ], JSON_UNESCAPED_UNICODE);

        $conn->close();
        exit;
    }

    $stmtAdmins->bind_param("i", $usuarioId);
    $stmtAdmins->execute();

    $resultAdmins = $stmtAdmins->get_result();
    $rowAdmins = $resultAdmins->fetch_assoc();

    $totalAdminsActivos = intval($rowAdmins["total"] ?? 0);

    $stmtAdmins->close();

    if ($totalAdminsActivos <= 0) {
        http_response_code(403);

        echo json_encode([
            "success" => false,
            "message" => "No puedes eliminar el último administrador activo del sistema"
        ], JSON_UNESCAPED_UNICODE);

        $conn->close();
        exit;
    }
}


/* =========================
   ELIMINAR USUARIO
========================= */

$transaccionIniciada = false;

$conn->begin_transaction();
$transaccionIniciada = true;

try {

    /* =========================
       ELIMINAR PERMISOS ASOCIADOS
    ========================= */

    $sqlDeletePermisos = "
        DELETE FROM usuario_permisos
        WHERE usuario_id = ?
    ";

    $stmtPermisos = $conn->prepare($sqlDeletePermisos);

    if (!$stmtPermisos) {
        throw new Exception("Error al preparar eliminación de permisos");
    }

    $stmtPermisos->bind_param("i", $usuarioId);

    if (!$stmtPermisos->execute()) {
        throw new Exception("Error al eliminar permisos del usuario");
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
        throw new Exception("Error al preparar eliminación de usuario");
    }

    $stmtDelete->bind_param("i", $usuarioId);

    if (!$stmtDelete->execute()) {
        throw new Exception("Error al eliminar usuario");
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


    echo json_encode([
        "success" => true,
        "message" => "Usuario eliminado correctamente",
        "usuario" => [
            "id" => intval($usuario["id"]),
            "nombre" => $usuario["nombre"],
            "correo" => $usuario["correo"],
            "rol" => $usuario["rol"],
            "estado" => $usuario["estado"]
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {

    if ($transaccionIniciada) {
        $conn->rollback();
    }

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}


$conn->close();