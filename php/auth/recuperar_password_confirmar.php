<?php

/* ===============================
   IRONIX - CONFIRMAR RECUPERACIÓN DE CONTRASEÑA
   Ruta: php/auth/recuperar_password_confirmar.php
================================ */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

date_default_timezone_set("America/Santiago");

require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


/* ===============================
   VALIDAR MÉTODO
================================ */

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* ===============================
   RECIBIR DATOS
================================ */

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    $input = $_POST;
}

$email = trim($input["email"] ?? "");
$codigo = trim($input["codigo"] ?? "");

$password = trim($input["password"] ?? "");
$confirmarPassword = trim(
    $input["confirmar_password"]
    ?? $input["confirmar"]
    ?? ""
);


/* ===============================
   VALIDACIONES BÁSICAS
================================ */

if ($email === "" || $codigo === "" || $password === "" || $confirmarPassword === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Correo, código y contraseña son obligatorios"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Correo inválido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (!preg_match('/^\d{6}$/', $codigo)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Código inválido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($password !== $confirmarPassword) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Las contraseñas no coinciden"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "La contraseña debe tener al menos 6 caracteres"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


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
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error interno al preparar la consulta"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmt->bind_param("s", $email);

if (!$stmt->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error interno al ejecutar la consulta"
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();
    $conn->close();
    exit;
}

$result = $stmt->get_result();

$mensajeCodigoInvalido = "Código inválido o expirado";

if (!$result || $result->num_rows === 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $mensajeCodigoInvalido
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();
    $conn->close();
    exit;
}

$usuario = $result->fetch_assoc();
$stmt->close();

$usuarioId = intval($usuario["id"]);
$estadoUsuario = $usuario["estado"] ?? "activa";
$passwordActualHash = $usuario["password"] ?? "";
$codigoHashGuardado = trim((string)($usuario["codigo_recuperacion"] ?? ""));
$codigoExpira = $usuario["codigo_expira"] ?? null;


/* ===============================
   VALIDAR ESTADO DE CUENTA
================================ */

if ($estadoUsuario !== "activa") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "La cuenta no está disponible para recuperación."
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}


/* ===============================
   VALIDAR CÓDIGO ACTIVO
================================ */

if ($codigoHashGuardado === "" || empty($codigoExpira)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $mensajeCodigoInvalido
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$timestampExpira = strtotime($codigoExpira);

if ($timestampExpira === false || $timestampExpira <= time()) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $mensajeCodigoInvalido
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

if (!password_verify($codigo, $codigoHashGuardado)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $mensajeCodigoInvalido
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}


/* ===============================
   VALIDAR CONTRASEÑA DISTINTA
================================ */

if ($passwordActualHash !== "" && password_verify($password, $passwordActualHash)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "La nueva contraseña debe ser distinta a la anterior"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
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
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error interno al preparar actualización"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtUpdate->bind_param("si", $nuevoHash, $usuarioId);

if (!$stmtUpdate->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar contraseña"
    ], JSON_UNESCAPED_UNICODE);

    $stmtUpdate->close();
    $conn->close();
    exit;
}

if ($stmtUpdate->affected_rows < 0) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "No se pudo actualizar la contraseña"
    ], JSON_UNESCAPED_UNICODE);

    $stmtUpdate->close();
    $conn->close();
    exit;
}

$stmtUpdate->close();


/* ===============================
   RESPUESTA FINAL
================================ */

echo json_encode([
    "success" => true,
    "message" => "Contraseña actualizada correctamente"
], JSON_UNESCAPED_UNICODE);

$conn->close();
exit;