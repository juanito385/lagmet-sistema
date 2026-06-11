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

$nuevaPassword = isset($_POST["nueva_password"]) ? trim($_POST["nueva_password"]) : "";
$confirmarPassword = isset($_POST["confirmar_password"]) ? trim($_POST["confirmar_password"]) : "";

/* =========================
   VALIDACIONES
========================= */

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

if ($nuevaPassword === "" || $confirmarPassword === "") {
    echo json_encode([
        "success" => false,
        "message" => "Completa la nueva contraseña y su confirmación"
    ]);
    exit;
}

if ($nuevaPassword !== $confirmarPassword) {
    echo json_encode([
        "success" => false,
        "message" => "Las contraseñas no coinciden"
    ]);
    exit;
}

if (strlen($nuevaPassword) < 6) {
    echo json_encode([
        "success" => false,
        "message" => "La contraseña debe tener al menos 6 caracteres"
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
        "message" => "No tienes permisos para restablecer contraseñas"
    ]);
    $conn->close();
    exit;
}

/* =========================
   VALIDAR USUARIO OBJETIVO
========================= */

$sqlUsuario = "
    SELECT id, nombre, correo, rol
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
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar actualización de contraseña"
    ]);
    $conn->close();
    exit;
}

$stmtUpdate->bind_param("si", $passwordHash, $usuarioId);

if (!$stmtUpdate->execute()) {
    echo json_encode([
        "success" => false,
        "message" => "Error al restablecer contraseña"
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
    "message" => "Contraseña restablecida correctamente",
    "usuario" => [
        "id" => (int)$usuario["id"],
        "nombre" => $usuario["nombre"],
        "correo" => $usuario["correo"],
        "rol" => $usuario["rol"]
    ]
]);

$conn->close();
?>