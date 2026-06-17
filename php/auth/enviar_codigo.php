<?php

/* ===============================
   IRONIX - ENVIAR CÓDIGO DE RECUPERACIÓN
================================ */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

date_default_timezone_set("America/Santiago");

require_once __DIR__ . "/../conexion.php";
require_once __DIR__ . "/../helpers/mailer.php";

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

if ($email === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Ingresa tu correo"
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


/* ===============================
   BUSCAR USUARIO
================================ */

$stmt = $conn->prepare("
    SELECT 
        id, 
        nombre,
        correo,
        estado
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

/*
    Seguridad:
    No revelamos si el correo existe o no.
*/
if (!$result || $result->num_rows === 0) {
    $stmt->close();
    $conn->close();

    echo json_encode([
        "success" => true,
        "message" => "Si el correo está registrado, recibirás un código de recuperación."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$usuario = $result->fetch_assoc();
$stmt->close();


/* ===============================
   VALIDAR ESTADO DE CUENTA
================================ */

/*
    Seguridad:
    Si la cuenta está inactiva o bloqueada, no enviamos código.
    Pero respondemos genérico para no filtrar información.
*/

$estadoUsuario = $usuario["estado"] ?? "activa";

if ($estadoUsuario !== "activa") {
    $conn->close();

    echo json_encode([
        "success" => true,
        "message" => "Si el correo está registrado, recibirás un código de recuperación."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* ===============================
   GENERAR CÓDIGO
================================ */

/*
    Código visible para el usuario.
*/
$codigoPlano = (string) random_int(100000, 999999);

/*
    Código protegido para BD.
*/
$codigoHash = password_hash($codigoPlano, PASSWORD_DEFAULT);

$expira = date("Y-m-d H:i:s", strtotime("+10 minutes"));


/* ===============================
   GUARDAR HASH DEL CÓDIGO
================================ */

$stmtUpdate = $conn->prepare("
    UPDATE usuarios 
    SET 
        codigo_recuperacion = ?, 
        codigo_expira = ?
    WHERE id = ?
    LIMIT 1
");

if (!$stmtUpdate) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error interno al preparar guardado del código"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$usuarioId = intval($usuario["id"]);

$stmtUpdate->bind_param("ssi", $codigoHash, $expira, $usuarioId);

if (!$stmtUpdate->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error interno al guardar el código"
    ], JSON_UNESCAPED_UNICODE);

    $stmtUpdate->close();
    $conn->close();
    exit;
}

$stmtUpdate->close();


/* ===============================
   ENVIAR CÓDIGO POR CORREO
================================ */

$nombreUsuario = trim($usuario["nombre"] ?? "") !== ""
    ? trim($usuario["nombre"])
    : "Usuario IRONIX";

$html = "
    <div style='font-family: Arial, sans-serif; color:#222;'>
        <h2>Recuperación de contraseña - IRONIX</h2>

        <p>Recibimos una solicitud para recuperar tu contraseña.</p>

        <p>Tu código de recuperación es:</p>

        <div style='
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 4px;
            background: #0f172a;
            color: #ffffff;
            padding: 14px 20px;
            display: inline-block;
            border-radius: 8px;
            margin: 12px 0;
        '>
            {$codigoPlano}
        </div>

        <p>Este código expirará en 10 minutos.</p>

        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>

        <hr>

        <small>IRONIX - Industrial Monitoring & Production Control System</small>
    </div>
";

$resultadoCorreo = enviarCorreoIronix(
    $usuario["correo"],
    $nombreUsuario,
    "Código de recuperación - IRONIX",
    $html,
    "Tu código de recuperación IRONIX es: {$codigoPlano}"
);

if (!$resultadoCorreo["success"]) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "No se pudo enviar el correo de recuperación",
        "error" => $resultadoCorreo["error"] ?? "Error desconocido"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}


/* ===============================
   RESPUESTA FINAL
================================ */

echo json_encode([
    "success" => true,
    "message" => "Si el correo está registrado, recibirás un código de recuperación."
], JSON_UNESCAPED_UNICODE);

$conn->close();
exit;