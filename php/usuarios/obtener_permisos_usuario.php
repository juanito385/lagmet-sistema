<?php

/* =========================
   IRONIX - OBTENER PERMISOS DE USUARIO
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("configuracion", "permisos");


require_once __DIR__ . "/../conexion.php";


/* =========================
   VALIDAR MÉTODO
========================= */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Método no permitido",
        "permisos" => []
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* =========================
   OBTENER ID USUARIO
========================= */

$usuarioId = isset($_GET["usuario_id"]) ? intval($_GET["usuario_id"]) : 0;

if ($usuarioId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID de usuario no recibido",
        "permisos" => []
    ], JSON_UNESCAPED_UNICODE);

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
        "message" => "Error al preparar validación de usuario",
        "permisos" => []
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtUsuario->bind_param("i", $usuarioId);

if (!$stmtUsuario->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al ejecutar validación de usuario",
        "permisos" => []
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
        "message" => "Usuario no encontrado",
        "permisos" => []
    ], JSON_UNESCAPED_UNICODE);

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
   ADMIN SIEMPRE TOTAL
========================= */

/*
    Seguridad:
    Si el usuario objetivo es admin, se devuelve acceso total.
    Esto evita que un admin antiguo sin filas completas en usuario_permisos
    aparezca visualmente sin permisos.
*/

if ($usuario["rol"] === "admin") {
    foreach ($modulosSistema as $modulo) {
        $permisos[$modulo] = [
            "ver" => true,
            "crear" => true,
            "editar" => true,
            "eliminar" => true,
            "exportar" => true
        ];
    }

    echo json_encode([
        "success" => true,
        "usuario" => [
            "id" => intval($usuario["id"]),
            "nombre" => $usuario["nombre"],
            "correo" => $usuario["correo"],
            "rol" => $usuario["rol"],
            "estado" => $usuario["estado"]
        ],
        "permisos" => $permisos
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
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
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al preparar consulta de permisos",
        "permisos" => []
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtPermisos->bind_param("i", $usuarioId);

if (!$stmtPermisos->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al ejecutar consulta de permisos",
        "permisos" => []
    ], JSON_UNESCAPED_UNICODE);

    $stmtPermisos->close();
    $conn->close();
    exit;
}

$resultPermisos = $stmtPermisos->get_result();

while ($row = $resultPermisos->fetch_assoc()) {
    $modulo = $row["modulo"];

    if (!in_array($modulo, $modulosSistema, true)) {
        continue;
    }

    $permisos[$modulo] = [
        "ver" => intval($row["puede_ver"]) === 1,
        "crear" => intval($row["puede_crear"]) === 1,
        "editar" => intval($row["puede_editar"]) === 1,
        "eliminar" => intval($row["puede_eliminar"]) === 1,
        "exportar" => intval($row["puede_exportar"]) === 1
    ];
}

$stmtPermisos->close();


/* =========================
   PERFIL SIEMPRE VISIBLE
========================= */

$permisos["perfil"]["ver"] = true;


/* =========================
   RESPUESTA
========================= */

echo json_encode([
    "success" => true,
    "usuario" => [
        "id" => intval($usuario["id"]),
        "nombre" => $usuario["nombre"],
        "correo" => $usuario["correo"],
        "rol" => $usuario["rol"],
        "estado" => $usuario["estado"]
    ],
    "permisos" => $permisos
], JSON_UNESCAPED_UNICODE);

$conn->close();