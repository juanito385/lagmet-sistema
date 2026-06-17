<?php

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

require_once __DIR__ . "/session_config.php";
require_once __DIR__ . "/../conexion.php";

/* ===============================
   VALIDAR SESIÓN ACTIVA
================================ */

if (!ironixValidarSesionActiva()) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => "Sesión no iniciada o expirada"
    ]);

    exit;
}

/* ===============================
   DATOS BASE DE SESIÓN
================================ */

$usuarioId = isset($_SESSION["ironix_usuario_id"])
    ? intval($_SESSION["ironix_usuario_id"])
    : 0;

$nombre = $_SESSION["ironix_usuario_nombre"] ?? "Usuario";
$correo = $_SESSION["ironix_usuario_correo"] ?? "";
$rol = $_SESSION["ironix_usuario_rol"] ?? "usuario";

if ($usuarioId <= 0) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => "Sesión inválida"
    ]);

    exit;
}

/* ===============================
   OBTENER ESTADO ACTUAL DEL USUARIO
================================ */

$estadoUsuario = "activa";

$stmtUsuario = $conn->prepare("
    SELECT estado
    FROM usuarios
    WHERE id = ?
    LIMIT 1
");

if ($stmtUsuario) {
    $stmtUsuario->bind_param("i", $usuarioId);
    $stmtUsuario->execute();

    $resultUsuario = $stmtUsuario->get_result();

    if ($resultUsuario && $resultUsuario->num_rows > 0) {
        $usuarioBD = $resultUsuario->fetch_assoc();
        $estadoUsuario = $usuarioBD["estado"] ?? "activa";
    }

    $stmtUsuario->close();
}

/* ===============================
   BLOQUEAR SESIÓN SI USUARIO NO ESTÁ ACTIVO
================================ */

if ($estadoUsuario === "inactiva" || $estadoUsuario === "bloqueada") {
    ironixCerrarSesion();

    http_response_code(401);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => "Tu cuenta ya no está activa. Contacta al administrador."
    ]);

    if (isset($conn)) {
        $conn->close();
    }

    exit;
}

/* ===============================
   OBTENER PERMISOS DEL USUARIO
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
    $stmtPermisos->bind_param("i", $usuarioId);
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
]);

$conn->close();

exit;

?>