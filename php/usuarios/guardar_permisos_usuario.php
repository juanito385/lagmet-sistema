<?php

/* =========================
   IRONIX - GUARDAR PERMISOS DE USUARIO
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("POST");
ironixRequerirPermiso("configuracion", "permisos");


/* =========================
   ADMIN AUTENTICADO
========================= */

/*
    Seguridad Fase 4:
    No se recibe admin_id desde frontend.
    El usuario autorizado ya fue validado por guard.php.
*/

$adminId = intval($IRONIX_USER_ID ?? ($_SESSION["ironix_usuario_id"] ?? 0));

if ($adminId <= 0) {
    ironixResponderNoAutorizado("Administrador autenticado no válido");
}


/* =========================
   RECIBIR DATOS
========================= */

/*
    Compatible con:
    - JSON enviado por fetch
    - FormData / POST tradicional
*/

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    $input = $_POST;
}

$usuarioId = isset($input["usuario_id"]) ? intval($input["usuario_id"]) : 0;
$permisosRaw = $input["permisos"] ?? "";


/* =========================
   VALIDACIONES BASE
========================= */

if ($usuarioId <= 0) {
    ironixResponderJson([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ], 400);
}

if ($permisosRaw === "" || $permisosRaw === null) {
    ironixResponderJson([
        "success" => false,
        "message" => "Permisos no recibidos"
    ], 400);
}

if (is_array($permisosRaw)) {
    $permisosRecibidos = $permisosRaw;
} else {
    $permisosRecibidos = json_decode((string) $permisosRaw, true);
}

if (!is_array($permisosRecibidos)) {
    ironixResponderJson([
        "success" => false,
        "message" => "Formato de permisos inválido"
    ], 400);
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
   HELPERS
========================= */

if (!function_exists("permisoRecibido")) {
    function permisoRecibido($permisos, $modulo, $accion)
    {
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
}

if (!function_exists("accionDisponible")) {
    function accionDisponible($accionesDisponibles, $modulo, $accion)
    {
        if (!isset($accionesDisponibles[$modulo])) {
            return false;
        }

        return in_array($accion, $accionesDisponibles[$modulo], true);
    }
}


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");

$transaccionIniciada = false;


try {

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
        throw new Exception("Error al preparar validación de usuario: " . $conn->error);
    }

    $stmtUsuario->bind_param("i", $usuarioId);

    if (!$stmtUsuario->execute()) {
        throw new Exception("Error al ejecutar validación de usuario: " . $stmtUsuario->error);
    }

    $resultUsuario = $stmtUsuario->get_result();

    if (!$resultUsuario || $resultUsuario->num_rows === 0) {
        $stmtUsuario->close();
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "Usuario no encontrado"
        ], 404);
    }

    $usuario = $resultUsuario->fetch_assoc();
    $stmtUsuario->close();


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
        throw new Exception("Error al preparar guardado de permisos: " . $conn->error);
    }


    /* =========================
       GUARDAR PERMISOS
    ========================= */

    $conn->begin_transaction();
    $transaccionIniciada = true;

    foreach ($modulosSistema as $modulo) {

        /*
            Admin siempre mantiene acceso total.
            Esto evita dejar administradores sin acceso por error.
        */
        if (($usuario["rol"] ?? "") === "admin") {
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
            throw new Exception("Error al guardar permiso del módulo: " . $modulo . " - " . $stmt->error);
        }
    }

    $stmt->close();

    $conn->commit();
    $transaccionIniciada = false;

    $conn->close();

    ironixResponderJson([
        "success" => true,
        "message" => "Permisos detallados actualizados correctamente",
        "usuario" => [
            "id" => intval($usuario["id"]),
            "nombre" => $usuario["nombre"],
            "correo" => $usuario["correo"],
            "rol" => $usuario["rol"],
            "estado" => $usuario["estado"]
        ]
    ], 200);

} catch (Throwable $e) {

    if ($transaccionIniciada && isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }

    if (isset($stmtUsuario) && $stmtUsuario instanceof mysqli_stmt) {
        $stmtUsuario->close();
    }

    if (isset($stmt) && $stmt instanceof mysqli_stmt) {
        $stmt->close();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => $e->getMessage()
    ], 500);
}