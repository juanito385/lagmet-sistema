<?php

/* =========================
   IRONIX - RESTABLECER CONTRASEÑA DE USUARIO
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("configuracion", "seguridad");


require_once __DIR__ . "/../conexion.php";


/* =========================
   VALIDAR MÉTODO
========================= */

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* =========================
   ADMIN AUTENTICADO
========================= */

/*
    Seguridad Fase 3:
    No se recibe admin_id desde frontend.
    Se usa el usuario autenticado por guard.php.
*/

$adminId = intval($IRONIX_USER_ID);


/* =========================
   RECIBIR DATOS
========================= */

$usuarioId = isset($_POST["usuario_id"]) ? intval($_POST["usuario_id"]) : 0;

$nuevaPassword = isset($_POST["nueva_password"]) ? trim($_POST["nueva_password"]) : "";
$confirmarPassword = isset($_POST["confirmar_password"]) ? trim($_POST["confirmar_password"]) : "";


/* =========================
   VALIDACIONES
========================= */

if ($adminId <= 0) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Administrador autenticado no válido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($usuarioId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

/*
    Recomendado:
    Si el admin quiere cambiar su propia contraseña,
    debe hacerlo desde Perfil, donde se pide contraseña actual.
*/
if ($adminId === $usuarioId) {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "No puedes restablecer tu propia contraseña desde Configuración. Usa la sección Perfil."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($nuevaPassword === "" || $confirmarPassword === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Completa la nueva contraseña y su confirmación"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($nuevaPassword !== $confirmarPassword) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Las contraseñas no coinciden"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (strlen($nuevaPassword) < 6) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "La contraseña debe tener al menos 6 caracteres"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* =========================
   VALIDAR USUARIO OBJETIVO
========================= */

$sqlUsuario = "
    SELECT 
        id, 
        nombre, 
        correo, 
        rol,
        estado
    FROM usuarios
    WHERE id = ?
    LIMIT 1
";

$stmtUsuario = $conn->prepare($sqlUsuario);

if (!$stmtUsuario) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al validar usuario"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtUsuario->bind_param("i", $usuarioId);

if (!$stmtUsuario->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al ejecutar validación de usuario"
    ], JSON_UNESCAPED_UNICODE);

    $stmtUsuario->close();
    $conn->close();
    exit;
}

$resultUsuario = $stmtUsuario->get_result();

if (!$resultUsuario || $resultUsuario->num_rows === 0) {
    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado"
    ], JSON_UNESCAPED_UNICODE);

    $stmtUsuario->close();
    $conn->close();
    exit;
}

$usuario = $resultUsuario->fetch_assoc();
$stmtUsuario->close();


/* =========================
   ACTUALIZAR CONTRASEÑA
========================= */

$passwordHash = password_hash($nuevaPassword, PASSWORD_DEFAULT);

$sqlUpdate = "
    UPDATE usuarios
    SET password = ?
    WHERE id = ?
";

$stmtUpdate = $conn->prepare($sqlUpdate);

if (!$stmtUpdate) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al preparar actualización de contraseña"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtUpdate->bind_param("si", $passwordHash, $usuarioId);

if (!$stmtUpdate->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al restablecer contraseña"
    ], JSON_UNESCAPED_UNICODE);

    $stmtUpdate->close();
    $conn->close();
    exit;
}

$stmtUpdate->close();


/* =========================
   RESPUESTA
========================= */

echo json_encode([
    "success" => true,
    "message" => "Contraseña restablecida correctamente",
    "usuario" => [
        "id" => intval($usuario["id"]),
        "nombre" => $usuario["nombre"],
        "correo" => $usuario["correo"],
        "rol" => $usuario["rol"],
        "estado" => $usuario["estado"]
    ]
], JSON_UNESCAPED_UNICODE);

$conn->close();