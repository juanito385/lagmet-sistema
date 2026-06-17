<?php

/* ===============================
   IRONIX - LOGIN
================================ */

require_once __DIR__ . "/session_config.php";


/* ===============================
   HELPERS LOCALES AUTH
================================ */

/*
    Este archivo NO usa guard.php porque login.php debe funcionar
    antes de que exista una sesión activa.

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

$email = isset($input["email"]) ? trim((string) $input["email"]) : "";
$password = isset($input["password"]) ? trim((string) $input["password"]) : "";


/* ===============================
   VALIDACIONES BASE
================================ */

if ($email === "" || $password === "") {
    ironixAuthResponderJson([
        "success" => false,
        "message" => "Completa todos los campos"
    ], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    ironixAuthResponderJson([
        "success" => false,
        "message" => "Correo electrónico no válido"
    ], 400);
}


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");

$stmt = null;
$stmtPermisos = null;


try {

    /* ===============================
       BUSCAR USUARIO
    ================================ */

    $stmt = $conn->prepare("
        SELECT 
            id, 
            nombre, 
            correo, 
            password, 
            rol,
            estado
        FROM usuarios
        WHERE correo = ?
        LIMIT 1
    ");

    if (!$stmt) {
        throw new Exception("Error interno al preparar el login: " . $conn->error);
    }

    $stmt->bind_param("s", $email);

    if (!$stmt->execute()) {
        throw new Exception("Error interno al ejecutar el login: " . $stmt->error);
    }

    $result = $stmt->get_result();

    if (!$result || $result->num_rows === 0) {
        $stmt->close();
        $stmt = null;

        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => "Correo o contraseña incorrectos"
        ], 401);
    }

    $user = $result->fetch_assoc();

    $stmt->close();
    $stmt = null;


    /* ===============================
       VALIDAR ESTADO DE CUENTA
    ================================ */

    $estadoUsuario = $user["estado"] ?? "activa";

    if ($estadoUsuario === "inactiva") {
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => "Tu cuenta está inactiva. Contacta al administrador."
        ], 403);
    }

    if ($estadoUsuario === "bloqueada") {
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => "Tu cuenta está bloqueada. Contacta al administrador."
        ], 403);
    }


    /* ===============================
       VALIDAR CONTRASEÑA
    ================================ */

    if (!password_verify($password, $user["password"])) {
        $conn->close();

        ironixAuthResponderJson([
            "success" => false,
            "message" => "Correo o contraseña incorrectos"
        ], 401);
    }


    /* ===============================
       PERMISOS BASE FRONTEND
    ================================ */

    $modulosSistema = [
        "dashboard",
        "monitoreo",
        "productos",
        "documentacion",
        "flujo-proceso",
        "estados",
        "perfil",
        "configuracion"
    ];

    $permisos = [];

    foreach ($modulosSistema as $modulo) {
        $permisos[$modulo] = [
            "ver" => false,
            "crear" => false,
            "editar" => false,
            "eliminar" => false,
            "exportar" => false
        ];
    }


    /* ===============================
       OBTENER PERMISOS
    ================================ */

    if (($user["rol"] ?? "usuario") === "admin") {

        foreach ($modulosSistema as $modulo) {
            $permisos[$modulo] = [
                "ver" => true,
                "crear" => true,
                "editar" => true,
                "eliminar" => true,
                "exportar" => true
            ];
        }

    } else {

        $stmtPermisos = $conn->prepare("
            SELECT 
                modulo,
                puede_ver,
                puede_crear,
                puede_editar,
                puede_eliminar,
                puede_exportar
            FROM usuario_permisos
            WHERE usuario_id = ?
        ");

        if (!$stmtPermisos) {
            throw new Exception("Error al preparar consulta de permisos: " . $conn->error);
        }

        $userId = intval($user["id"]);

        $stmtPermisos->bind_param("i", $userId);

        if (!$stmtPermisos->execute()) {
            throw new Exception("Error al consultar permisos: " . $stmtPermisos->error);
        }

        $resultPermisos = $stmtPermisos->get_result();

        while ($permiso = $resultPermisos->fetch_assoc()) {
            $modulo = $permiso["modulo"];

            if (!in_array($modulo, $modulosSistema, true)) {
                continue;
            }

            $permisos[$modulo] = [
                "ver" => intval($permiso["puede_ver"]) === 1,
                "crear" => intval($permiso["puede_crear"]) === 1,
                "editar" => intval($permiso["puede_editar"]) === 1,
                "eliminar" => intval($permiso["puede_eliminar"]) === 1,
                "exportar" => intval($permiso["puede_exportar"]) === 1
            ];
        }

        $stmtPermisos->close();
        $stmtPermisos = null;
    }


    /* ===============================
       PERFIL SIEMPRE DISPONIBLE
    ================================ */

    $permisos["perfil"]["ver"] = true;
    $permisos["perfil"]["editar"] = true;


    /* ===============================
       CREAR SESIÓN PHP REAL
    ================================ */

    ironixCrearSesionUsuario([
        "id" => intval($user["id"]),
        "nombre" => $user["nombre"],
        "correo" => $user["correo"],
        "rol" => $user["rol"]
    ]);

    $_SESSION["ironix_usuario_estado"] = $estadoUsuario;


    /* ===============================
       LOGIN CORRECTO
    ================================ */

    $conn->close();

    ironixAuthResponderJson([
        "success" => true,
        "message" => "Login correcto",
        "user" => [
            "id" => intval($user["id"]),
            "nombre" => $user["nombre"],
            "correo" => $user["correo"],
            "email" => $user["correo"],
            "rol" => $user["rol"],
            "estado" => $estadoUsuario,
            "permisos" => $permisos
        ]
    ], 200);

} catch (Throwable $e) {

    if ($stmt instanceof mysqli_stmt) {
        $stmt->close();
    }

    if ($stmtPermisos instanceof mysqli_stmt) {
        $stmtPermisos->close();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixAuthResponderJson([
        "success" => false,
        "message" => "Error interno al iniciar sesión",
        "error" => $e->getMessage()
    ], 500);
}