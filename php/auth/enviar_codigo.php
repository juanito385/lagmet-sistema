<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../conexion.php";
require_once __DIR__ . "/../helpers/mailer.php";

$email = trim($_POST['email'] ?? '');

if ($email === '') {
    echo json_encode([
        "success" => false,
        "message" => "Ingresa tu correo"
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Correo inválido"
    ]);
    exit;
}

$stmt = $conn->prepare("
    SELECT id, correo
    FROM usuarios
    WHERE correo = ?
    LIMIT 1
");

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Error interno al preparar la consulta"
    ]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if (!$result || $result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Correo no registrado"
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

$usuario = $result->fetch_assoc();

/* =========================
   GENERAR CÓDIGO
========================= */

/*
    Este es el código visible para el usuario.
    Este código se envía por correo.
*/
$codigoPlano = (string) random_int(100000, 999999);

/*
    Este es el código protegido.
    Este hash se guarda en la base de datos.
*/
$codigoHash = password_hash($codigoPlano, PASSWORD_DEFAULT);

$expira = date("Y-m-d H:i:s", strtotime("+10 minutes"));

/* =========================
   GUARDAR HASH DEL CÓDIGO
========================= */

$stmtUpdate = $conn->prepare("
    UPDATE usuarios 
    SET codigo_recuperacion = ?, codigo_expira = ?
    WHERE correo = ?
");

if (!$stmtUpdate) {
    echo json_encode([
        "success" => false,
        "message" => "Error interno al guardar el código"
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

$stmtUpdate->bind_param("sss", $codigoHash, $expira, $email);
$stmtUpdate->execute();

/* =========================
   ENVIAR CÓDIGO POR GMAIL
========================= */

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
    "Usuario IRONIX",
    "Código de recuperación - IRONIX",
    $html,
    "Tu código de recuperación IRONIX es: {$codigoPlano}"
);

if (!$resultadoCorreo["success"]) {
    echo json_encode([
        "success" => false,
        "message" => "El código fue generado, pero no se pudo enviar el correo",
        "error" => $resultadoCorreo["error"] ?? "Error desconocido"
    ]);

    $stmtUpdate->close();
    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Código enviado correctamente"
]);

$stmtUpdate->close();
$stmt->close();
$conn->close();

?>