<?php

/* =========================
   IRONIX - LISTAR USUARIOS
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("configuracion", "ver");


require_once __DIR__ . "/../conexion.php";


/* =========================
   VALIDAR MÉTODO
========================= */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Método no permitido",
        "usuarios" => [],
        "total" => 0
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


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
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al preparar consulta de usuarios",
        "usuarios" => [],
        "total" => 0
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

if (!$stmt->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al ejecutar consulta de usuarios",
        "usuarios" => [],
        "total" => 0
    ], JSON_UNESCAPED_UNICODE);

    $stmt->close();
    $conn->close();
    exit;
}

$result = $stmt->get_result();

$usuarios = [];

while ($row = $result->fetch_assoc()) {
    $usuarios[] = [
        "id" => intval($row["id"]),
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


/* =========================
   RESPUESTA
========================= */

echo json_encode([
    "success" => true,
    "usuarios" => $usuarios,
    "total" => count($usuarios)
], JSON_UNESCAPED_UNICODE);

$stmt->close();
$conn->close();