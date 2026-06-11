<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . "/../conexion.php";

/* =========================
   LISTAR USUARIOS
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
    ORDER BY 
        CASE 
            WHEN rol = 'admin' THEN 0
            ELSE 1
        END,
        id ASC
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar consulta de usuarios"
    ]);
    exit;
}

$stmt->execute();
$result = $stmt->get_result();

$usuarios = [];

while ($row = $result->fetch_assoc()) {
    $usuarios[] = [
        "id" => (int)$row["id"],
        "nombre" => $row["nombre"],
        "correo" => $row["correo"],
        "rol" => $row["rol"],
        "telefono" => $row["telefono"],
        "area" => $row["area"],
        "idioma" => $row["idioma"],
        "estado" => $row["estado"],
        "fecha_creacion" => $row["fecha_creacion"]
    ];
}

echo json_encode([
    "success" => true,
    "usuarios" => $usuarios,
    "total" => count($usuarios)
]);

$stmt->close();
$conn->close();
?>