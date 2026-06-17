<?php

/* =========================
   IRONIX - RESTABLECER CONTRASEÑA DE USUARIO
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

$nuevaPassword = isset($input["nueva_password"]) ? trim((string) $input["nueva_password"]) : "";
$confirmarPassword = isset($input["confirmar_password"]) ? trim((string) $input["confirmar_password"]) : "";


/* =========================
   VALIDACIONES
========================= */

if ($usuarioId <= 0) {
    ironixResponderJson([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ], 400);
}

/*
    Recomendado:
    Si el admin quiere cambiar su propia contraseña,
    debe hacerlo desde Perfil, donde se pide contraseña actual.
*/

if ($adminId === $usuarioId) {
    ironixResponderJson([
        "success" => false,
        "message" => "No puedes restablecer tu propia contraseña desde Configuración. Usa la sección Perfil."
    ], 403);
}

if ($nuevaPassword === "" || $confirmarPassword === "") {
    ironixResponderJson([
        "success" => false,
        "message" => "Completa la nueva contraseña y su confirmación"
    ], 400);
}

if ($nuevaPassword !== $confirmarPassword) {
    ironixResponderJson([
        "success" => false,
        "message" => "Las contraseñas no coinciden"
    ], 400);
}

if (strlen($nuevaPassword) < 6) {
    ironixResponderJson([
        "success" => false,
        "message" => "La contraseña debe tener al menos 6 caracteres"
    ], 400);
}


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");

$stmtUsuario = null;
$stmtUpdate = null;


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
        $stmtUsuario = null;

        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "Usuario no encontrado"
        ], 404);
    }

    $usuario = $resultUsuario->fetch_assoc();

    $stmtUsuario->close();
    $stmtUsuario = null;


    /* =========================
       ACTUALIZAR CONTRASEÑA
    ========================= */

    $passwordHash = password_hash($nuevaPassword, PASSWORD_DEFAULT);

    $sqlUpdate = "
        UPDATE usuarios
        SET password = ?
        WHERE id = ?
    ";

    $stmtUpdate = $conn->prepare($sqlUpdate);

    if (!$stmtUpdate) {
        throw new Exception("Error al preparar actualización de contraseña: " . $conn->error);
    }

    $stmtUpdate->bind_param("si", $passwordHash, $usuarioId);

    if (!$stmtUpdate->execute()) {
        throw new Exception("Error al restablecer contraseña: " . $stmtUpdate->error);
    }

    $stmtUpdate->close();
    $stmtUpdate = null;


    /* =========================
       RESPUESTA
    ========================= */

    $conn->close();

    ironixResponderJson([
        "success" => true,
        "message" => "Contraseña restablecida correctamente",
        "usuario" => [
            "id" => intval($usuario["id"]),
            "nombre" => $usuario["nombre"],
            "correo" => $usuario["correo"],
            "rol" => $usuario["rol"],
            "estado" => $usuario["estado"]
        ]
    ], 200);

} catch (Throwable $e) {

    if ($stmtUsuario instanceof mysqli_stmt) {
        $stmtUsuario->close();
    }

    if ($stmtUpdate instanceof mysqli_stmt) {
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