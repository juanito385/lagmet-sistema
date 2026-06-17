<?php

/* ==================================================
   IRONIX - PERFIL - CAMBIAR CONTRASEÑA
   Ruta: php/perfil/cambiar_password.php
================================================== */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("POST");
ironixRequerirPermiso("perfil", "cambiar_password");


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

$idSesion = intval($IRONIX_USER_ID ?? ($_SESSION["ironix_usuario_id"] ?? 0));
$idSolicitado = intval($input["usuario_id"] ?? 0);

$actual = trim((string) ($input["actual"] ?? ""));
$nueva = trim((string) ($input["nueva"] ?? ""));
$confirmar = trim((string) ($input["confirmar"] ?? ""));


/* =========================
   VALIDACIONES
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
    El usuario solo puede cambiar su propia contraseña.
*/
if ($idSolicitado !== $idSesion) {
    ironixResponderJson([
        "success" => false,
        "message" => "No tienes permisos para cambiar la contraseña de otro usuario"
    ], 403);
}

$id = $idSesion;

if ($actual === "" || $nueva === "" || $confirmar === "") {
    ironixResponderJson([
        "success" => false,
        "message" => "Completa todos los campos"
    ], 422);
}

if ($nueva !== $confirmar) {
    ironixResponderJson([
        "success" => false,
        "message" => "Las contraseñas no coinciden"
    ], 422);
}

if (strlen($nueva) < 6) {
    ironixResponderJson([
        "success" => false,
        "message" => "La nueva contraseña debe tener al menos 6 caracteres"
    ], 422);
}

if ($actual === $nueva) {
    ironixResponderJson([
        "success" => false,
        "message" => "La nueva contraseña debe ser distinta a la actual"
    ], 422);
}


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


try {

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
        throw new Exception("Error al preparar consulta: " . $conn->error);
    }

    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
        throw new Exception("Error al ejecutar consulta: " . $stmt->error);
    }

    $result = $stmt->get_result();

    if (!$result || $result->num_rows === 0) {
        $stmt->close();
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "Usuario no encontrado"
        ], 404);
    }

    $usuario = $result->fetch_assoc();

    $stmt->close();


    /* =========================
       VALIDAR CONTRASEÑA ACTUAL
    ========================= */

    /*
        Se usa 422 en vez de 401 para evitar que el frontend interprete
        una contraseña incorrecta como sesión expirada.
    */

    if (!password_verify($actual, $usuario["password"])) {
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "Contraseña actual incorrecta"
        ], 422);
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
        throw new Exception("Error al preparar actualización: " . $conn->error);
    }

    $stmtUpdate->bind_param("si", $nuevaHash, $id);

    if (!$stmtUpdate->execute()) {
        throw new Exception("Error al actualizar contraseña: " . $stmtUpdate->error);
    }

    $stmtUpdate->close();


    /* =========================
       REFRESCAR SESIÓN
    ========================= */

    session_regenerate_id(true);
    $_SESSION["ironix_ultima_actividad"] = time();


    /* =========================
       RESPUESTA
    ========================= */

    $conn->close();

    ironixResponderJson([
        "success" => true,
        "message" => "Contraseña actualizada correctamente"
    ], 200);

} catch (Throwable $e) {

    if (isset($stmt) && $stmt instanceof mysqli_stmt) {
        $stmt->close();
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