<?php

/* ===============================
   IRONIX - VERIFICAR SESIÓN
================================ */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

require_once __DIR__ . "/session_config.php";
require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


/* ===============================
   VALIDAR MÉTODO
================================ */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => "Método no permitido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* ===============================
   VALIDAR SESIÓN ACTIVA
================================ */

if (!ironixValidarSesionActiva()) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => "Sesión no iniciada o expirada"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* ===============================
   DATOS BASE DE SESIÓN
================================ */

$usuarioId = isset($_SESSION["ironix_usuario_id"])
    ? intval($_SESSION["ironix_usuario_id"])
    : 0;

if ($usuarioId <= 0) {
    ironixCerrarSesion();

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => "Sesión inválida"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* ===============================
   OBTENER USUARIO ACTUAL DESDE BD
================================ */

$stmtUsuario = $conn->prepare("
    SELECT 
        id,
        nombre,
        correo,
        rol,
        estado
    FROM usuarios
    WHERE id = ?
    LIMIT 1
");

if (!$stmtUsuario) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => "Error al preparar validación de usuario"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtUsuario->bind_param("i", $usuarioId);

if (!$stmtUsuario->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => "Error al validar usuario"
    ], JSON_UNESCAPED_UNICODE);

    $stmtUsuario->close();
    $conn->close();
    exit;
}

$resultUsuario = $stmtUsuario->get_result();

if (!$resultUsuario || $resultUsuario->num_rows === 0) {
    $stmtUsuario->close();
    $conn->close();

    ironixCerrarSesion();

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => "Usuario no encontrado o sesión inválida"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$usuarioBD = $resultUsuario->fetch_assoc();
$stmtUsuario->close();

$nombre = $usuarioBD["nombre"] ?? "Usuario";
$correo = $usuarioBD["correo"] ?? "";
$rol = $usuarioBD["rol"] ?? "usuario";
$estadoUsuario = $usuarioBD["estado"] ?? "activa";


/* ===============================
   BLOQUEAR SI USUARIO NO ESTÁ ACTIVO
================================ */

if ($estadoUsuario !== "activa") {
    $conn->close();

    ironixCerrarSesion();

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => "Tu cuenta ya no está activa. Contacta al administrador."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* ===============================
   SINCRONIZAR SESIÓN CON BD
================================ */

/*
    Importante:
    Si el administrador cambia nombre, correo o rol,
    la sesión queda actualizada al verificar.
*/

$_SESSION["ironix_usuario_nombre"] = $nombre;
$_SESSION["ironix_usuario_correo"] = $correo;
$_SESSION["ironix_usuario_rol"] = $rol;


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
   ADMIN SIEMPRE TOTAL EN FRONTEND
================================ */

if ($rol === "admin") {
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

    /* ===============================
       OBTENER PERMISOS DEL USUARIO
    ================================ */

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
        http_response_code(500);

        echo json_encode([
            "success" => false,
            "auth" => false,
            "message" => "Error al preparar consulta de permisos"
        ], JSON_UNESCAPED_UNICODE);

        $conn->close();
        exit;
    }

    $stmtPermisos->bind_param("i", $usuarioId);

    if (!$stmtPermisos->execute()) {
        http_response_code(500);

        echo json_encode([
            "success" => false,
            "auth" => false,
            "message" => "Error al consultar permisos"
        ], JSON_UNESCAPED_UNICODE);

        $stmtPermisos->close();
        $conn->close();
        exit;
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
}


/* ===============================
   PERFIL SIEMPRE DISPONIBLE
================================ */

$permisos["perfil"]["ver"] = true;
$permisos["perfil"]["editar"] = true;


/* ===============================
   RESPUESTA SESIÓN VÁLIDA
================================ */

echo json_encode([
    "success" => true,
    "auth" => true,
    "message" => "Sesión activa",
    "user" => [
        "id" => $usuarioId,
        "nombre" => $nombre,
        "correo" => $correo,
        "email" => $correo,
        "rol" => $rol,
        "estado" => $estadoUsuario,
        "permisos" => $permisos
    ]
], JSON_UNESCAPED_UNICODE);

$conn->close();

exit;