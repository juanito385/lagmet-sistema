<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . "/../conexion.php";

/* =========================
   RECIBIR DATOS
========================= */

$id = isset($_POST["usuario_id"]) ? intval($_POST["usuario_id"]) : 0;
$actual = isset($_POST["actual"]) ? trim($_POST["actual"]) : "";
$nueva = isset($_POST["nueva"]) ? trim($_POST["nueva"]) : "";
$confirmar = isset($_POST["confirmar"]) ? trim($_POST["confirmar"]) : "";

if ($id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ]);
    exit;
}

if ($actual === "" || $nueva === "" || $confirmar === "") {
    echo json_encode([
        "success" => false,
        "message" => "Completa todos los campos"
    ]);
    exit;
}

if ($nueva !== $confirmar) {
    echo json_encode([
        "success" => false,
        "message" => "Las contraseñas no coinciden"
    ]);
    exit;
}

if (strlen($nueva) < 6) {
    echo json_encode([
        "success" => false,
        "message" => "La nueva contraseña debe tener al menos 6 caracteres"
    ]);
    exit;
}

/* =========================
   OBTENER CONTRASEÑA ACTUAL
========================= */

$sql = "
    SELECT password 
    FROM usuarios 
    WHERE id = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar consulta"
    ]);
    exit;
}

$stmt->bind_param("i", $id);
$stmt->execute();

$result = $stmt->get_result();

if (!$result || $result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado"
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$usuario = $result->fetch_assoc();

$stmt->close();

/* =========================
   VALIDAR CONTRASEÑA ACTUAL
========================= */

if (!password_verify($actual, $usuario["password"])) {
    echo json_encode([
        "success" => false,
        "message" => "Contraseña actual incorrecta"
    ]);
    $conn->close();
    exit;
}

/* =========================
   ACTUALIZAR CONTRASEÑA
========================= */

$nuevaHash = password_hash($nueva, PASSWORD_DEFAULT);

$sqlUpdate = "
    UPDATE usuarios 
    SET password = ? 
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

$stmtUpdate->bind_param("si", $nuevaHash, $id);

if ($stmtUpdate->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Contraseña actualizada correctamente"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar contraseña"
    ]);
}

$stmtUpdate->close();
$conn->close();
?>