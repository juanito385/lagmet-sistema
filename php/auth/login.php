<?php

/* ===============================
   IRONIX - LOGIN
================================ */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

require_once __DIR__ . "/../conexion.php";
require_once __DIR__ . "/session_config.php";

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
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "JSON inválido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$email = isset($input["email"]) ? trim($input["email"]) : "";
$password = isset($input["password"]) ? trim($input["password"]) : "";

if ($email === "" || $password === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Completa todos los campos"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Correo electrónico no válido"
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
        password, 
        rol,
        estado
    FROM usuarios
    WHERE correo = ?
    LIMIT 1
");

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error interno al preparar el login"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmt->bind_param("s", $email);

if (!$stmt->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error interno al ejecutar el login"
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();
    $conn->close();
    exit;
}

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Correo o contraseña incorrectos"
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();
    $conn->close();
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();


/* ===============================
   VALIDAR ESTADO DE CUENTA
================================ */

$estadoUsuario = $user["estado"] ?? "activa";

if ($estadoUsuario === "inactiva") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Tu cuenta está inactiva. Contacta al administrador."
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

if ($estadoUsuario === "bloqueada") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "Tu cuenta está bloqueada. Contacta al administrador."
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}


/* ===============================
   VALIDAR CONTRASEÑA
================================ */

if (!password_verify($password, $user["password"])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Correo o contraseña incorrectos"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
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

    if ($stmtPermisos) {
        $userId = intval($user["id"]);

        $stmtPermisos->bind_param("i", $userId);
        $stmtPermisos->execute();

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
    }
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


/* ===============================
   LOGIN CORRECTO
================================ */

echo json_encode([
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
], JSON_UNESCAPED_UNICODE);

$conn->close();
exit;