<?php

/* ===============================
   IRONIX - CONFIRMAR RECUPERACIÓN DE CONTRASEÑA
   Ruta: php/auth/recuperar_password_confirmar.php
================================ */

date_default_timezone_set("America/Santiago");


/* ===============================
   HELPERS LOCALES AUTH
================================ */

/*
    Este archivo NO usa guard.php porque debe funcionar
    sin sesión iniciada.

    Por eso usa helpers locales para responder JSON.
*/

if (!function_exists("ironixAuthAplicarHeadersJson")) {
    function ironixAuthAplicarHeadersJson()
    {
        header("Content-Type: application/json; charset=utf-8");
        header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
        header("Pragma: no-cache");
    }
}

if (!function_exists("ironixAuthResponderJson")) {
    function ironixAuthResponderJson($data, $httpCode = 200)
    {
        ironixAuthAplicarHeadersJson();
        http_response_code($httpCode);

        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

ironixAuthAplicarHeadersJson();


/* ===============================
   VALIDAR MÉTODO
================================ */

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    ironixAuthResponderJson([
        "success" => false,
        "message" => "Método no permitido"
    ], 405);
}


/* ===============================
   RECIBIR DATOS
================================ */

/*
    Compatible con:
    - JSON enviado por fetch
    - FormData / POST tradicional
*/

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    $input = $_POST;
}

$email = trim((string) ($input["email"] ?? ""));
$codigo = trim((string) ($input["codigo"] ?? ""));

$password = trim((string) ($input["password"] ?? ""));
$confirmarPassword = trim((string) (
    $input["confirmar_password"]
    ?? $input["confirmar"]
    ?? ""
));


/* ===============================
   VALIDACIONES BÁSICAS
================================ */

if ($email === "" || $codigo === "" || $password === "" || $confirmarPassword === "") {
    ironixAuthResponderJson([
        "success" => false,
        "message" => "Correo, código y contraseña son obligatorios"
    ], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    ironixAuthResponderJson([
        "success" => false,
        "message" => "Correo inválido"
    ], 400);
}

if (!preg_match('/^\d{6}$/', $codigo)) {
    ironixAuthResponderJson([
        "success" => false,
        "message" => "Código inválido"
    ], 400);
}

if ($password !== $confirmarPassword) {
    ironixAuthResponderJson([
        "success" => false,
        "message" => "Las contraseñas no coinciden"
    ], 400);
}

if (strlen($password) < 6) {
    ironixAuthResponderJson([
        "success" => false,
        "message" => "La contraseña debe tener al menos 6 caracteres"
    ], 400);
}


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");

$stmt = null;
$stmtUpdate = null;

$mensajeCodigoInvalido = "Código inválido o expirado";


try {

    /* ===============================
       BUSCAR USUARIO Y CÓDIGO ACTIVO
    ================================ */

    $stmt = $conn->prepare("
        SELECT 
            id,
            correo,
            estado,
            password,
            codigo_recuperacion,
            codigo_expira
        FROM usuarios
        WHERE correo = ?
        LIMIT 1
    ");

    if (!$stmt) {
        throw new Exception("Error interno al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param("s", $email);

    if (!$stmt->execute()) {
        throw new Exception("Error interno al ejecutar la consulta: " . $stmt->error);
    }

    $result = $stmt->get_result();

    if (!$result || $result->num_rows === 0) {
        $stmt->close();
        $stmt = null;

        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => $mensajeCodigoInvalido
        ], 400);
    }

    $usuario = $result->fetch_assoc();

    $stmt->close();
    $stmt = null;

    $usuarioId = intval($usuario["id"]);
    $estadoUsuario = $usuario["estado"] ?? "activa";
    $passwordActualHash = $usuario["password"] ?? "";
    $codigoHashGuardado = trim((string) ($usuario["codigo_recuperacion"] ?? ""));
    $codigoExpira = $usuario["codigo_expira"] ?? null;


    /* ===============================
       VALIDAR ESTADO DE CUENTA
    ================================ */

    /*
        Seguridad:
        No se revela si la cuenta está inactiva o bloqueada.
    */

    if ($estadoUsuario !== "activa") {
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => $mensajeCodigoInvalido
        ], 400);
    }


    /* ===============================
       VALIDAR CÓDIGO ACTIVO
    ================================ */

    if ($codigoHashGuardado === "" || empty($codigoExpira)) {
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => $mensajeCodigoInvalido
        ], 400);
    }

    $timestampExpira = strtotime($codigoExpira);

    if ($timestampExpira === false || $timestampExpira <= time()) {
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => $mensajeCodigoInvalido
        ], 400);
    }

    if (!password_verify($codigo, $codigoHashGuardado)) {
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => $mensajeCodigoInvalido
        ], 400);
    }


    /* ===============================
       VALIDAR CONTRASEÑA DISTINTA
    ================================ */

    if ($passwordActualHash !== "" && password_verify($password, $passwordActualHash)) {
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => "La nueva contraseña debe ser distinta a la anterior"
        ], 400);
    }


    /* ===============================
       ACTUALIZAR CONTRASEÑA
    ================================ */

    $nuevoHash = password_hash($password, PASSWORD_DEFAULT);

    $stmtUpdate = $conn->prepare("
        UPDATE usuarios 
        SET 
            password = ?,
            codigo_recuperacion = NULL,
            codigo_expira = NULL
        WHERE id = ?
        LIMIT 1
    ");

    if (!$stmtUpdate) {
        throw new Exception("Error interno al preparar actualización: " . $conn->error);
    }

    $stmtUpdate->bind_param("si", $nuevoHash, $usuarioId);

    if (!$stmtUpdate->execute()) {
        throw new Exception("Error al actualizar contraseña: " . $stmtUpdate->error);
    }

    if ($stmtUpdate->affected_rows < 0) {
        throw new Exception("No se pudo actualizar la contraseña");
    }

    $stmtUpdate->close();
    $stmtUpdate = null;


    /* ===============================
       RESPUESTA FINAL
    ================================ */

    $conn->close();

    ironixAuthResponderJson([
        "success" => true,
        "message" => "Contraseña actualizada correctamente"
    ], 200);

} catch (Throwable $e) {

    if ($stmt instanceof mysqli_stmt) {
        $stmt->close();
    }

    if ($stmtUpdate instanceof mysqli_stmt) {
        $stmtUpdate->close();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixAuthResponderJson([
        "success" => false,
        "message" => "Error al confirmar recuperación de contraseña",
        "error" => $e->getMessage()
    ], 500);
}