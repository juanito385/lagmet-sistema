<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . "/../conexion.php";

/* =========================
   RECIBIR DATOS
========================= */

$id = isset($_POST["usuario_id"]) ? intval($_POST["usuario_id"]) : 0;
$nombre = isset($_POST["nombre"]) ? trim($_POST["nombre"]) : "";
$correo = isset($_POST["correo"]) ? trim($_POST["correo"]) : "";

if ($id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ]);
    exit;
}

if ($nombre === "" || $correo === "") {
    echo json_encode([
        "success" => false,
        "message" => "Completa nombre y correo"
    ]);
    exit;
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Correo electrónico no válido"
    ]);
    exit;
}

/* =========================
   VALIDAR CORREO DUPLICADO
========================= */

$sqlCorreo = "
    SELECT id 
    FROM usuarios 
    WHERE correo = ? 
    AND id <> ?
    LIMIT 1
";

$stmtCorreo = $conn->prepare($sqlCorreo);

if (!$stmtCorreo) {
    echo json_encode([
        "success" => false,
        "message" => "Error al validar correo"
    ]);
    exit;
}

$stmtCorreo->bind_param("si", $correo, $id);
$stmtCorreo->execute();

$resultCorreo = $stmtCorreo->get_result();

if ($resultCorreo && $resultCorreo->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "El correo ya está registrado por otro usuario"
    ]);
    $stmtCorreo->close();
    $conn->close();
    exit;
}

$stmtCorreo->close();

/* =========================
   ACTUALIZAR USUARIO
========================= */

$sql = "
    UPDATE usuarios 
    SET nombre = ?, correo = ? 
    WHERE id = ?
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar actualización"
    ]);
    exit;
}

$stmt->bind_param("ssi", $nombre, $correo, $id);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Datos actualizados correctamente",
        "usuario" => [
            "id" => $id,
            "nombre" => $nombre,
            "email" => $correo
        ]
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar usuario"
    ]);
}

$stmt->close();
$conn->close();
?>