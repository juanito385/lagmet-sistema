<?php

/* ===============================
   IRONIX - ENVIAR CÓDIGO DE RECUPERACIÓN
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

if ($email === "") {
    ironixAuthResponderJson([
        "success" => false,
        "message" => "Ingresa tu correo"
    ], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    ironixAuthResponderJson([
        "success" => false,
        "message" => "Correo inválido"
    ], 400);
}


require_once __DIR__ . "/../conexion.php";
require_once __DIR__ . "/../helpers/mailer.php";

$conn->set_charset("utf8mb4");

$stmt = null;
$stmtUpdate = null;


try {

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
        throw new Exception("Error interno al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param("s", $email);

    if (!$stmt->execute()) {
        throw new Exception("Error interno al ejecutar la consulta: " . $stmt->error);
    }

    $result = $stmt->get_result();

    /*
        Seguridad:
        No revelamos si el correo existe o no.
    */
    if (!$result || $result->num_rows === 0) {
        $stmt->close();
        $stmt = null;

        $conn->close();

        ironixAuthResponderJson([
            "success" => true,
            "message" => "Si el correo está registrado, recibirás un código de recuperación."
        ], 200);
    }

    $usuario = $result->fetch_assoc();

    $stmt->close();
    $stmt = null;


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

        ironixAuthResponderJson([
            "success" => true,
            "message" => "Si el correo está registrado, recibirás un código de recuperación."
        ], 200);
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
        throw new Exception("Error interno al preparar guardado del código: " . $conn->error);
    }

    $usuarioId = intval($usuario["id"]);

    $stmtUpdate->bind_param("ssi", $codigoHash, $expira, $usuarioId);

    if (!$stmtUpdate->execute()) {
        throw new Exception("Error interno al guardar el código: " . $stmtUpdate->error);
    }

    $stmtUpdate->close();
    $stmtUpdate = null;


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
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => "No se pudo enviar el correo de recuperación",
            "error" => $resultadoCorreo["error"] ?? "Error desconocido"
        ], 500);
    }


    /* ===============================
       RESPUESTA FINAL
    ================================ */

    $conn->close();

    ironixAuthResponderJson([
        "success" => true,
        "message" => "Si el correo está registrado, recibirás un código de recuperación."
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
        "message" => "Error al enviar código de recuperación",
        "error" => $e->getMessage()
    ], 500);
}