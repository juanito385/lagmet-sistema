<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../conexion.php";
require_once __DIR__ . "/session_config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$email = isset($input["email"]) ? trim($input["email"]) : "";
$password = isset($input["password"]) ? trim($input["password"]) : "";

if ($email === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "Completa todos los campos"
    ]);
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
    echo json_encode([
        "success" => false,
        "message" => "Error interno al preparar el login"
    ]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado"
    ]);

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
    echo json_encode([
        "success" => false,
        "message" => "Tu cuenta está inactiva. Contacta al administrador."
    ]);

    $conn->close();
    exit;
}

if ($estadoUsuario === "bloqueada") {
    echo json_encode([
        "success" => false,
        "message" => "Tu cuenta está bloqueada. Contacta al administrador."
    ]);

    $conn->close();
    exit;
}

/* ===============================
   VALIDAR CONTRASEÑA ENCRIPTADA
================================ */

if (!password_verify($password, $user["password"])) {
    echo json_encode([
        "success" => false,
        "message" => "Contraseña incorrecta"
    ]);

    $conn->close();
    exit;
}

/* ===============================
   OBTENER PERMISOS
================================ */

$permisos = [];

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
    $stmtPermisos->bind_param("i", $user["id"]);
    $stmtPermisos->execute();

    $resultPermisos = $stmtPermisos->get_result();

    while ($permiso = $resultPermisos->fetch_assoc()) {
        $modulo = $permiso["modulo"];

        $permisos[$modulo] = [
            "ver" => (int)$permiso["puede_ver"] === 1,
            "crear" => (int)$permiso["puede_crear"] === 1,
            "editar" => (int)$permiso["puede_editar"] === 1,
            "eliminar" => (int)$permiso["puede_eliminar"] === 1,
            "exportar" => (int)$permiso["puede_exportar"] === 1
        ];
    }

    $stmtPermisos->close();
}

/* ===============================
   CREAR SESIÓN PHP REAL
================================ */

ironixCrearSesionUsuario([
    "id" => $user["id"],
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
        "id" => $user["id"],
        "nombre" => $user["nombre"],
        "email" => $user["correo"],
        "rol" => $user["rol"],
        "estado" => $estadoUsuario,
        "permisos" => $permisos
    ]
]);

$conn->close();

?>