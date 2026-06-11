<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . "/../conexion.php";

/* =========================
   OBTENER ID USUARIO
========================= */

$usuarioId = isset($_GET["usuario_id"]) ? intval($_GET["usuario_id"]) : 0;

if ($usuarioId <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ]);
    exit;
}

/* =========================
   MÓDULOS DEL SISTEMA
========================= */

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

/* =========================
   VALIDAR USUARIO
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
        "message" => "Error al preparar validación de usuario"
    ]);
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
   PERMISOS BASE
========================= */

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

/* =========================
   CONSULTAR PERMISOS
========================= */

$sqlPermisos = "
    SELECT
        modulo,
        puede_ver,
        puede_crear,
        puede_editar,
        puede_eliminar,
        puede_exportar
    FROM usuario_permisos
    WHERE usuario_id = ?
";

$stmtPermisos = $conn->prepare($sqlPermisos);

if (!$stmtPermisos) {
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar consulta de permisos"
    ]);
    $conn->close();
    exit;
}

$stmtPermisos->bind_param("i", $usuarioId);
$stmtPermisos->execute();

$resultPermisos = $stmtPermisos->get_result();

while ($row = $resultPermisos->fetch_assoc()) {
    $modulo = $row["modulo"];

    $permisos[$modulo] = [
        "ver" => (int)$row["puede_ver"] === 1,
        "crear" => (int)$row["puede_crear"] === 1,
        "editar" => (int)$row["puede_editar"] === 1,
        "eliminar" => (int)$row["puede_eliminar"] === 1,
        "exportar" => (int)$row["puede_exportar"] === 1
    ];
}

$stmtPermisos->close();

/* =========================
   RESPUESTA
========================= */

echo json_encode([
    "success" => true,
    "usuario" => [
        "id" => (int)$usuario["id"],
        "nombre" => $usuario["nombre"],
        "correo" => $usuario["correo"],
        "rol" => $usuario["rol"],
        "estado" => $usuario["estado"]
    ],
    "permisos" => $permisos
]);

$conn->close();
?>