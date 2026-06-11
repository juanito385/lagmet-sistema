<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . "/../conexion.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ]);
    exit;
}

/* =========================
   RECIBIR DATOS
========================= */

$adminId = isset($_POST["admin_id"]) ? intval($_POST["admin_id"]) : 0;
$usuarioId = isset($_POST["usuario_id"]) ? intval($_POST["usuario_id"]) : 0;
$estado = isset($_POST["estado"]) ? trim($_POST["estado"]) : "";

$estadosPermitidos = ["activa", "inactiva", "bloqueada"];

if ($adminId <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID de administrador no recibido"
    ]);
    exit;
}

if ($usuarioId <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ]);
    exit;
}

if (!in_array($estado, $estadosPermitidos)) {
    echo json_encode([
        "success" => false,
        "message" => "Estado no válido"
    ]);
    exit;
}

/* =========================
   VALIDAR ADMINISTRADOR
========================= */

$sqlAdmin = "
    SELECT id, rol
    FROM usuarios
    WHERE id = ?
    LIMIT 1
";

$stmtAdmin = $conn->prepare($sqlAdmin);

if (!$stmtAdmin) {
    echo json_encode([
        "success" => false,
        "message" => "Error al validar administrador"
    ]);
    exit;
}

$stmtAdmin->bind_param("i", $adminId);
$stmtAdmin->execute();

$resultAdmin = $stmtAdmin->get_result();

if (!$resultAdmin || $resultAdmin->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Administrador no encontrado"
    ]);
    $stmtAdmin->close();
    $conn->close();
    exit;
}

$admin = $resultAdmin->fetch_assoc();
$stmtAdmin->close();

if ($admin["rol"] !== "admin") {
    echo json_encode([
        "success" => false,
        "message" => "No tienes permisos para modificar usuarios"
    ]);
    $conn->close();
    exit;
}

/* =========================
   VALIDAR USUARIO OBJETIVO
========================= */

$sqlUsuario = "
    SELECT id, nombre, correo, rol, estado
    FROM usuarios
    WHERE id = ?
    LIMIT 1
";

$stmtUsuario = $conn->prepare($sqlUsuario);

if (!$stmtUsuario) {
    echo json_encode([
        "success" => false,
        "message" => "Error al validar usuario"
    ]);
    $conn->close();
    exit;
}

$stmtUsuario->bind_param("i", $usuarioId);
$stmtUsuario->execute();

$resultUsuario = $stmtUsuario->get_result();

if (!$resultUsuario || $resultUsuario->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado"
    ]);
    $stmtUsuario->close();
    $conn->close();
    exit;
}

$usuario = $resultUsuario->fetch_assoc();
$stmtUsuario->close();

/*
    Protección:
    No permitimos bloquear o desactivar administradores.
    Así evitas quedarte sin acceso al sistema.
*/
if ($usuario["rol"] === "admin" && $estado !== "activa") {
    echo json_encode([
        "success" => false,
        "message" => "No se puede bloquear o desactivar un administrador"
    ]);
    $conn->close();
    exit;
}

/*
    Protección:
    El administrador no puede bloquearse o desactivarse a sí mismo.
*/
if ($adminId === $usuarioId && $estado !== "activa") {
    echo json_encode([
        "success" => false,
        "message" => "No puedes bloquear o desactivar tu propia cuenta"
    ]);
    $conn->close();
    exit;
}

/* =========================
   ACTUALIZAR ESTADO
========================= */

$sqlUpdate = "
    UPDATE usuarios
    SET estado = ?
    WHERE id = ?
";

$stmtUpdate = $conn->prepare($sqlUpdate);

if (!$stmtUpdate) {
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar actualización"
    ]);
    $conn->close();
    exit;
}

$stmtUpdate->bind_param("si", $estado, $usuarioId);

if (!$stmtUpdate->execute()) {
    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar estado del usuario"
    ]);
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
    "message" => "Estado del usuario actualizado correctamente",
    "usuario" => [
        "id" => (int)$usuario["id"],
        "nombre" => $usuario["nombre"],
        "correo" => $usuario["correo"],
        "rol" => $usuario["rol"],
        "estado" => $estado
    ]
]);

$conn->close();
?>