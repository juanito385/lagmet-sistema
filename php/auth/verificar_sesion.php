<?php

/* ===============================
   IRONIX - VERIFICAR SESIÓN
================================ */

require_once __DIR__ . "/session_config.php";


/* ===============================
   HELPERS LOCALES AUTH
================================ */

/*
    Este archivo NO usa guard.php directamente porque justamente
    se encarga de verificar si existe una sesión válida.

    Por eso define helpers locales para responder JSON
    sin depender del guard general.
*/

if (!function_exists("ironixAuthAplicarHeadersJson")) {
    function ironixAuthAplicarHeadersJson()
    {
        header("Content-Type: application/json; charset=utf-8");
        header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
        header("Pragma: no-cache");
    }
}

if (!function_exists("ironixAuthResponderJson")) {
    function ironixAuthResponderJson($data, $httpCode = 200)
    {
        ironixAuthAplicarHeadersJson();
        http_response_code($httpCode);

        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

ironixAuthAplicarHeadersJson();


/* ===============================
   VALIDAR MÉTODO
================================ */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    ironixAuthResponderJson([
        "success" => false,
        "auth" => false,
        "message" => "Método no permitido"
    ], 405);
}


/* ===============================
   VALIDAR SESIÓN ACTIVA
================================ */

if (!ironixValidarSesionActiva()) {
    ironixAuthResponderJson([
        "success" => false,
        "auth" => false,
        "message" => "Sesión no iniciada o expirada"
    ], 401);
}


/* ===============================
   DATOS BASE DE SESIÓN
================================ */

$usuarioId = isset($_SESSION["ironix_usuario_id"])
    ? intval($_SESSION["ironix_usuario_id"])
    : 0;

if ($usuarioId <= 0) {
    ironixCerrarSesion();

    ironixAuthResponderJson([
        "success" => false,
        "auth" => false,
        "message" => "Sesión inválida"
    ], 401);
}


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");

$stmtUsuario = null;
$stmtPermisos = null;


try {

    /* ===============================
       OBTENER USUARIO ACTUAL DESDE BD
    ================================ */

    $stmtUsuario = $conn->prepare("
        SELECT 
            id,
            nombre,
            correo,
            rol,
            estado
        FROM usuarios
        WHERE id = ?
        LIMIT 1
    ");

    if (!$stmtUsuario) {
        throw new Exception("Error al preparar validación de usuario: " . $conn->error);
    }

    $stmtUsuario->bind_param("i", $usuarioId);

    if (!$stmtUsuario->execute()) {
        throw new Exception("Error al validar usuario: " . $stmtUsuario->error);
    }

    $resultUsuario = $stmtUsuario->get_result();

    if (!$resultUsuario || $resultUsuario->num_rows === 0) {
        $stmtUsuario->close();
        $stmtUsuario = null;

        $conn->close();

        ironixCerrarSesion();

        ironixAuthResponderJson([
            "success" => false,
            "auth" => false,
            "message" => "Usuario no encontrado o sesión inválida"
        ], 401);
    }

    $usuarioBD = $resultUsuario->fetch_assoc();

    $stmtUsuario->close();
    $stmtUsuario = null;

    $nombre = $usuarioBD["nombre"] ?? "Usuario";
    $correo = $usuarioBD["correo"] ?? "";
    $rol = strtolower(trim($usuarioBD["rol"] ?? "usuario"));
    $estadoUsuario = strtolower(trim($usuarioBD["estado"] ?? "activa"));


    /* ===============================
       BLOQUEAR SI USUARIO NO ESTÁ ACTIVO
    ================================ */

    if ($estadoUsuario !== "activa") {
        $conn->close();

        ironixCerrarSesion();

        ironixAuthResponderJson([
            "success" => false,
            "auth" => false,
            "message" => "Tu cuenta ya no está activa. Contacta al administrador."
        ], 401);
    }


    /* ===============================
       SINCRONIZAR SESIÓN CON BD
    ================================ */

    /*
        Importante:
        Si el administrador cambia nombre, correo, rol o estado,
        la sesión queda actualizada al verificar.
    */

    $_SESSION["ironix_usuario_nombre"] = $nombre;
    $_SESSION["ironix_usuario_correo"] = $correo;
    $_SESSION["ironix_usuario_rol"] = $rol;
    $_SESSION["ironix_usuario_estado"] = $estadoUsuario;


    /* ===============================
       PERMISOS BASE FRONTEND
    ================================ */

    $modulosSistema = [
        "dashboard",
        "monitoreo",
        "productos",
        "documentacion",
        "flujo-proceso",
        "flujo_proceso",
        "estados",
        "perfil",
        "configuracion"
    ];

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


    /* ===============================
       ADMIN SIEMPRE TOTAL EN FRONTEND
    ================================ */

    if ($rol === "admin") {
        foreach ($modulosSistema as $modulo) {
            $permisos[$modulo] = [
                "ver" => true,
                "crear" => true,
                "editar" => true,
                "eliminar" => true,
                "exportar" => true
            ];
        }

    } else {

        /* ===============================
           OBTENER PERMISOS DEL USUARIO
        ================================ */

        $stmtPermisos = $conn->prepare("
            SELECT 
                modulo,
                puede_ver,
                puede_crear,
                puede_editar,
                puede_eliminar,
                puede_exportar
            FROM usuario_permisos
            WHERE usuario_id = ?
        ");

        if (!$stmtPermisos) {
            throw new Exception("Error al preparar consulta de permisos: " . $conn->error);
        }

        $stmtPermisos->bind_param("i", $usuarioId);

        if (!$stmtPermisos->execute()) {
            throw new Exception("Error al consultar permisos: " . $stmtPermisos->error);
        }

        $resultPermisos = $stmtPermisos->get_result();

        while ($permiso = $resultPermisos->fetch_assoc()) {
            $modulo = trim($permiso["modulo"] ?? "");

            if ($modulo === "") {
                continue;
            }

            /*
                Fase 5:
                Normalizamos alias para evitar diferencias entre frontend y backend.
                En frontend se usa principalmente "flujo-proceso".
                En backend también puede aparecer como "flujo_proceso".
            */
            if ($modulo === "flujo_proceso") {
                $modulo = "flujo-proceso";
            }

            if (!in_array($modulo, $modulosSistema, true)) {
                continue;
            }

            $permisos[$modulo] = [
                "ver" => intval($permiso["puede_ver"]) === 1,
                "crear" => intval($permiso["puede_crear"]) === 1,
                "editar" => intval($permiso["puede_editar"]) === 1,
                "eliminar" => intval($permiso["puede_eliminar"]) === 1,
                "exportar" => intval($permiso["puede_exportar"]) === 1
            ];
        }

        $stmtPermisos->close();
        $stmtPermisos = null;
    }


    /* ===============================
    PERFIL SIEMPRE DISPONIBLE
    ================================ */

    $permisos["perfil"]["ver"] = true;
    $permisos["perfil"]["editar"] = true;


    /* ===============================
    SINCRONIZAR ALIAS DE MÓDULOS
    ================================ */

    /*
        Mantiene disponibles ambos nombres del módulo Flujo Proceso.
        Esto evita inconsistencias entre:
        - permisos guardados en BD
        - permisos usados por frontend
        - permisos usados por backend
    */

    if (isset($permisos["flujo-proceso"])) {
        $permisos["flujo_proceso"] = $permisos["flujo-proceso"];
    }

    if (isset($permisos["flujo_proceso"])) {
        $permisos["flujo-proceso"] = $permisos["flujo_proceso"];
    }


    /* ===============================
    SINCRONIZAR PERMISOS EN SESIÓN
    ================================ */

    /*
    Importante Fase 5:
    Si el administrador modifica permisos mientras el usuario está logueado,
    verificar_sesion.php debe actualizar tanto el frontend como la sesión PHP.

        Esto mantiene alineados:
        - localStorage del navegador
        - $_SESSION["ironix_usuario_permisos"]
        - permisos visuales
        - permisos auxiliares de sesión
    */

    $_SESSION["ironix_usuario_permisos"] = $permisos;
    $_SESSION["ironix_ultima_actividad"] = time();


    /* ===============================
    RESPUESTA SESIÓN VÁLIDA
    ================================ */

    $conn->close();

    ironixAuthResponderJson([
        "success" => true,
        "auth" => true,
        "message" => "Sesión activa",
        "user" => [
            "id" => $usuarioId,
            "nombre" => $nombre,
            "correo" => $correo,
            "email" => $correo,
            "rol" => $rol,
            "estado" => $estadoUsuario,
            "permisos" => $permisos
        ]
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

    ironixAuthResponderJson([
        "success" => false,
        "auth" => false,
        "message" => "Error al verificar sesión",
        "error" => $e->getMessage()
    ], 500);
}