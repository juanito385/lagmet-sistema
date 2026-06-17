<?php

/* ===============================
   IRONIX - VERIFICAR CÓDIGO DE RECUPERACIÓN
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


/* ===============================
   VALIDACIONES BÁSICAS
================================ */

if ($email === "" || $codigo === "") {
    ironixAuthResponderJson([
        "success" => false,
        "message" => "Correo y código son obligatorios"
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


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");

$stmt = null;

$mensajeCodigoInvalido = "Código inválido o expirado";


try {

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
        throw new Exception("Error interno al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param("s", $email);

    if (!$stmt->execute()) {
        throw new Exception("Error interno al ejecutar la consulta: " . $stmt->error);
    }

    $result = $stmt->get_result();


    /* ===============================
       RESPUESTA GENÉRICA DE ERROR
    ================================ */

    /*
        Seguridad:
        No revelamos si el correo existe, si no tiene código,
        si expiró, si la cuenta no está activa o si el código es incorrecto.
    */

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

    $codigoHashGuardado = $usuario["codigo_recuperacion"] ?? "";
    $codigoExpira = $usuario["codigo_expira"] ?? null;
    $estadoUsuario = $usuario["estado"] ?? "activa";


    /* ===============================
       VALIDAR ESTADO DE CUENTA
    ================================ */

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

    if ($codigoHashGuardado === "" || $codigoExpira === null) {
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => $mensajeCodigoInvalido
        ], 400);
    }

    if (strtotime($codigoExpira) <= time()) {
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => $mensajeCodigoInvalido
        ], 400);
    }


    /* ===============================
       VALIDAR HASH DEL CÓDIGO
    ================================ */

    if (!password_verify($codigo, $codigoHashGuardado)) {
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => $mensajeCodigoInvalido
        ], 400);
    }


    /* ===============================
       RESPUESTA OK
    ================================ */

    $conn->close();

    ironixAuthResponderJson([
        "success" => true,
        "message" => "Código verificado correctamente"
    ], 200);

} catch (Throwable $e) {

    if ($stmt instanceof mysqli_stmt) {
        $stmt->close();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixAuthResponderJson([
        "success" => false,
        "message" => "Error al verificar código de recuperación",
        "error" => $e->getMessage()
    ], 500);
}