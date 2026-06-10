<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . "/../conexion.php";

/* =========================
   OBTENER ID USUARIO
========================= */

$id = isset($_GET["usuario_id"]) ? intval($_GET["usuario_id"]) : 0;

if ($id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ]);
    exit;
}

/* =========================
   CONSULTAR USUARIO
========================= */

$sql = "
    SELECT 
        id, 
        nombre, 
        correo, 
        rol,
        telefono,
        area,
        idioma,
        estado,
        fecha_creacion
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

if ($result && $result->num_rows > 0) {
    echo json_encode([
        "success" => true,
        "usuario" => $result->fetch_assoc()
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado"
    ]);
}

$stmt->close();
$conn->close();
?>