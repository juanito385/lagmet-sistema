<?php

/* ===============================
   IRONIX - VERIFICAR CÓDIGO DE RECUPERACIÓN
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


/* ===============================
   VALIDACIONES BÁSICAS
================================ */

if ($email === "" || $codigo === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Correo y código son obligatorios"
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


/* ===============================
   BUSCAR USUARIO
================================ */

/*
    El código está guardado como hash, por eso se busca solo por correo.
*/

$stmt = $conn->prepare("
    SELECT 
        id, 
        correo,
        estado,
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


/* ===============================
   RESPUESTA GENÉRICA DE ERROR
================================ */

/*
    Seguridad:
    No revelamos si el correo existe, si no tiene código,
    si expiró o si el código es incorrecto.
*/

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

$codigoHashGuardado = $usuario["codigo_recuperacion"] ?? "";
$codigoExpira = $usuario["codigo_expira"] ?? null;
$estadoUsuario = $usuario["estado"] ?? "activa";


/* ===============================
   VALIDAR ESTADO DE CUENTA
================================ */

if ($estadoUsuario !== "activa") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "La cuenta no está disponible para recuperación."
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();
    $conn->close();
    exit;
}


/* ===============================
   VALIDAR CÓDIGO ACTIVO
================================ */

if ($codigoHashGuardado === "" || $codigoExpira === null) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $mensajeCodigoInvalido
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();
    $conn->close();
    exit;
}

if (strtotime($codigoExpira) <= time()) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $mensajeCodigoInvalido
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();
    $conn->close();
    exit;
}


/* ===============================
   VALIDAR HASH DEL CÓDIGO
================================ */

if (!password_verify($codigo, $codigoHashGuardado)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $mensajeCodigoInvalido
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();
    $conn->close();
    exit;
}


/* ===============================
   RESPUESTA OK
================================ */

echo json_encode([
    "success" => true,
    "message" => "Código verificado correctamente"
], JSON_UNESCAPED_UNICODE);

$stmt->close();
$conn->close();

exit;