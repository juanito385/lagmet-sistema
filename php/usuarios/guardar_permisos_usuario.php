<?php

/* =========================
   IRONIX - GUARDAR PERMISOS DE USUARIO
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

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* =========================
   ADMIN AUTENTICADO
========================= */

/*
    Seguridad Fase 3:
    No se recibe admin_id desde frontend.
    El usuario autorizado ya fue validado por guard.php.
*/

$adminId = intval($IRONIX_USER_ID);


/* =========================
   RECIBIR DATOS
========================= */

$usuarioId = isset($_POST["usuario_id"]) ? intval($_POST["usuario_id"]) : 0;
$permisosJson = isset($_POST["permisos"]) ? $_POST["permisos"] : "";

if ($adminId <= 0) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Administrador autenticado no válido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($usuarioId <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($permisosJson === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Permisos no recibidos"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$permisosRecibidos = json_decode($permisosJson, true);

if (!is_array($permisosRecibidos)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Formato de permisos inválido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


/* =========================
   MÓDULOS Y ACCIONES
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

$accionesDisponibles = [
    "dashboard" => ["ver"],

    "monitoreo" => ["ver", "crear", "editar", "eliminar", "exportar"],

    "productos" => ["ver", "crear", "editar", "eliminar", "exportar"],

    "documentacion" => ["ver", "exportar"],

    "flujo-proceso" => ["ver", "crear", "editar", "eliminar", "exportar"],

    "estados" => ["ver", "editar", "exportar"],

    "perfil" => ["ver", "editar"],

    "configuracion" => ["ver", "crear", "editar", "eliminar", "exportar"]
];


/* =========================
   VALIDAR USUARIO OBJETIVO
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
        "message" => "Error al preparar validación de usuario"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtUsuario->bind_param("i", $usuarioId);

if (!$stmtUsuario->execute()) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al ejecutar validación de usuario"
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
        "message" => "Usuario no encontrado"
    ], JSON_UNESCAPED_UNICODE);

    $stmtUsuario->close();
    $conn->close();
    exit;
}

$usuario = $resultUsuario->fetch_assoc();
$stmtUsuario->close();


/* =========================
   HELPERS
========================= */

function permisoRecibido($permisos, $modulo, $accion) {
    if (!isset($permisos[$modulo])) {
        return false;
    }

    /*
        Compatibilidad con formato antiguo:
        "dashboard": true
    */
    if (is_bool($permisos[$modulo])) {
        return $accion === "ver" ? $permisos[$modulo] : false;
    }

    /*
        Formato nuevo:
        "productos": {
            "ver": true,
            "crear": true,
            "editar": true,
            "eliminar": false,
            "exportar": false
        }
    */
    if (is_array($permisos[$modulo])) {
        return !empty($permisos[$modulo][$accion]);
    }

    return false;
}

function accionDisponible($accionesDisponibles, $modulo, $accion) {
    if (!isset($accionesDisponibles[$modulo])) {
        return false;
    }

    return in_array($accion, $accionesDisponibles[$modulo], true);
}


/* =========================
   PREPARAR GUARDADO
========================= */

$sql = "
    INSERT INTO usuario_permisos
    (
        usuario_id,
        modulo,
        puede_ver,
        puede_crear,
        puede_editar,
        puede_eliminar,
        puede_exportar
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        puede_ver = VALUES(puede_ver),
        puede_crear = VALUES(puede_crear),
        puede_editar = VALUES(puede_editar),
        puede_eliminar = VALUES(puede_eliminar),
        puede_exportar = VALUES(puede_exportar)
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al preparar guardado de permisos"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}


/* =========================
   GUARDAR PERMISOS
========================= */

$transaccionIniciada = false;

$conn->begin_transaction();
$transaccionIniciada = true;

try {

    foreach ($modulosSistema as $modulo) {

        /*
            Admin siempre mantiene acceso total.
            Esto evita dejar administradores sin acceso por error.
        */
        if ($usuario["rol"] === "admin") {
            $puedeVer = 1;
            $puedeCrear = 1;
            $puedeEditar = 1;
            $puedeEliminar = 1;
            $puedeExportar = 1;
        } else {

            $puedeVer = permisoRecibido($permisosRecibidos, $modulo, "ver") ? 1 : 0;
            $puedeCrear = permisoRecibido($permisosRecibidos, $modulo, "crear") ? 1 : 0;
            $puedeEditar = permisoRecibido($permisosRecibidos, $modulo, "editar") ? 1 : 0;
            $puedeEliminar = permisoRecibido($permisosRecibidos, $modulo, "eliminar") ? 1 : 0;
            $puedeExportar = permisoRecibido($permisosRecibidos, $modulo, "exportar") ? 1 : 0;

            /*
                Acciones no disponibles para ese módulo quedan en 0.
            */
            if (!accionDisponible($accionesDisponibles, $modulo, "crear")) {
                $puedeCrear = 0;
            }

            if (!accionDisponible($accionesDisponibles, $modulo, "editar")) {
                $puedeEditar = 0;
            }

            if (!accionDisponible($accionesDisponibles, $modulo, "eliminar")) {
                $puedeEliminar = 0;
            }

            if (!accionDisponible($accionesDisponibles, $modulo, "exportar")) {
                $puedeExportar = 0;
            }

            /*
                Perfil siempre visible.
            */
            if ($modulo === "perfil") {
                $puedeVer = 1;
            }

            /*
                Si no puede ver el módulo, no puede ejecutar acciones internas.
            */
            if ($puedeVer === 0) {
                $puedeCrear = 0;
                $puedeEditar = 0;
                $puedeEliminar = 0;
                $puedeExportar = 0;
            }
        }

        $stmt->bind_param(
            "isiiiii",
            $usuarioId,
            $modulo,
            $puedeVer,
            $puedeCrear,
            $puedeEditar,
            $puedeEliminar,
            $puedeExportar
        );

        if (!$stmt->execute()) {
            throw new Exception("Error al guardar permiso del módulo: " . $modulo);
        }
    }

    $conn->commit();
    $transaccionIniciada = false;

    echo json_encode([
        "success" => true,
        "message" => "Permisos detallados actualizados correctamente",
        "usuario" => [
            "id" => intval($usuario["id"]),
            "nombre" => $usuario["nombre"],
            "correo" => $usuario["correo"],
            "rol" => $usuario["rol"],
            "estado" => $usuario["estado"]
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {

    if ($transaccionIniciada) {
        $conn->rollback();
    }

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

$stmt->close();
$conn->close();