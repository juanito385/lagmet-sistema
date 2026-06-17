<?php

/* =========================
   IRONIX - OBTENER PERMISOS DE USUARIO
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("GET");
ironixRequerirPermiso("configuracion", "permisos");


/* =========================
   OBTENER ID USUARIO
========================= */

$usuarioId = isset($_GET["usuario_id"]) ? intval($_GET["usuario_id"]) : 0;

if ($usuarioId <= 0) {
    ironixResponderJson([
        "success" => false,
        "message" => "ID de usuario no recibido",
        "permisos" => []
    ], 400);
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


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");

$stmtUsuario = null;
$stmtPermisos = null;


try {

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
        throw new Exception("Error al preparar validación de usuario: " . $conn->error);
    }

    $stmtUsuario->bind_param("i", $usuarioId);

    if (!$stmtUsuario->execute()) {
        throw new Exception("Error al ejecutar validación de usuario: " . $stmtUsuario->error);
    }

    $resultUsuario = $stmtUsuario->get_result();

    if (!$resultUsuario || $resultUsuario->num_rows === 0) {
        $stmtUsuario->close();
        $stmtUsuario = null;

        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "Usuario no encontrado",
            "permisos" => []
        ], 404);
    }

    $usuario = $resultUsuario->fetch_assoc();

    $stmtUsuario->close();
    $stmtUsuario = null;


    /* =========================
       ADMIN SIEMPRE TOTAL
    ========================= */

    /*
        Seguridad:
        Si el usuario objetivo es admin, se devuelve acceso total.
        Esto evita que un admin antiguo sin filas completas en usuario_permisos
        aparezca visualmente sin permisos.
    */

    if (($usuario["rol"] ?? "") === "admin") {
        foreach ($modulosSistema as $modulo) {
            $permisos[$modulo] = [
                "ver" => true,
                "crear" => true,
                "editar" => true,
                "eliminar" => true,
                "exportar" => true
            ];
        }

        $conn->close();

        ironixResponderJson([
            "success" => true,
            "usuario" => [
                "id" => intval($usuario["id"]),
                "nombre" => $usuario["nombre"],
                "correo" => $usuario["correo"],
                "rol" => $usuario["rol"],
                "estado" => $usuario["estado"]
            ],
            "permisos" => $permisos
        ], 200);
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
        throw new Exception("Error al preparar consulta de permisos: " . $conn->error);
    }

    $stmtPermisos->bind_param("i", $usuarioId);

    if (!$stmtPermisos->execute()) {
        throw new Exception("Error al ejecutar consulta de permisos: " . $stmtPermisos->error);
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
    $stmtPermisos = null;


    /* =========================
       PERFIL SIEMPRE VISIBLE
    ========================= */

    $permisos["perfil"]["ver"] = true;


    /* =========================
       RESPUESTA
    ========================= */

    $conn->close();

    ironixResponderJson([
        "success" => true,
        "usuario" => [
            "id" => intval($usuario["id"]),
            "nombre" => $usuario["nombre"],
            "correo" => $usuario["correo"],
            "rol" => $usuario["rol"],
            "estado" => $usuario["estado"]
        ],
        "permisos" => $permisos
    ], 200);

} catch (Throwable $e) {

    if ($stmtUsuario instanceof mysqli_stmt) {
        $stmtUsuario->close();
    }

    if ($stmtPermisos instanceof mysqli_stmt) {
        $stmtPermisos->close();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => $e->getMessage(),
        "permisos" => []
    ], 500);
}