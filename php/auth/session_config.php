<?php

/* =========================
   IRONIX - CONFIGURACIÓN DE SESIÓN
========================= */

/*
    Este archivo centraliza:
    - Configuración de sesión.
    - Headers JSON / no cache.
    - Respuestas JSON reutilizables.
    - Validación de método HTTP.
    - Creación, validación y cierre de sesión.

    Importante:
    - Los permisos por módulo/acción se validan en auth/guard.php.
    - Este archivo NO debe definir ironixTienePermiso()
      ni ironixRequerirPermiso(), para evitar conflictos con guard.php.
*/


/* =========================
   INICIAR SESIÓN
========================= */

if (session_status() === PHP_SESSION_NONE) {

    /*
        Configuración segura de cookies de sesión.

        Localhost:
        - secure = false

        Producción con HTTPS:
        - secure = true
    */
    session_set_cookie_params([
        "lifetime" => 0,
        "path" => "/",
        "domain" => "",
        "secure" => false,
        "httponly" => true,
        "samesite" => "Lax"
    ]);

    session_start();
}


/* =========================
   TIEMPO MÁXIMO DE SESIÓN
========================= */

/*
    Tiempo máximo de inactividad:
    2 horas = 7200 segundos
*/

if (!defined("IRONIX_SESSION_TIMEOUT")) {
    define("IRONIX_SESSION_TIMEOUT", 7200);
}


/* =========================
   HEADERS JSON / NO CACHE
========================= */

if (!function_exists("ironixAplicarHeadersJson")) {
    function ironixAplicarHeadersJson()
    {
        if (!headers_sent()) {
            header("Content-Type: application/json; charset=utf-8");
            header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
            header("Pragma: no-cache");
        }
    }
}


/* =========================
   RESPUESTA JSON GENERAL
========================= */

if (!function_exists("ironixResponderJson")) {
    function ironixResponderJson($data, $httpCode = 200)
    {
        ironixAplicarHeadersJson();
        http_response_code($httpCode);

        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}


/* =========================
   RESPUESTA JSON NO AUTORIZADA
========================= */

if (!function_exists("ironixResponderNoAutorizado")) {
    function ironixResponderNoAutorizado($mensaje = "No autorizado")
    {
        ironixResponderJson([
            "success" => false,
            "auth" => false,
            "message" => $mensaje
        ], 401);
    }
}


/* =========================
   RESPUESTA JSON SIN PERMISOS
========================= */

if (!function_exists("ironixResponderSinPermisos")) {
    function ironixResponderSinPermisos($mensaje = "No tienes permisos para realizar esta acción")
    {
        ironixResponderJson([
            "success" => false,
            "auth" => true,
            "permission" => false,
            "permiso" => false,
            "message" => $mensaje
        ], 403);
    }
}


/* =========================
   RESPUESTA MÉTODO NO PERMITIDO
========================= */

if (!function_exists("ironixResponderMetodoNoPermitido")) {
    function ironixResponderMetodoNoPermitido($metodosPermitidos = "POST")
    {
        if (is_array($metodosPermitidos)) {
            $metodosPermitidos = implode(", ", $metodosPermitidos);
        }

        ironixResponderJson([
            "success" => false,
            "message" => "Método no permitido",
            "allowed_methods" => $metodosPermitidos
        ], 405);
    }
}


/* =========================
   VALIDAR MÉTODO HTTP
========================= */

if (!function_exists("ironixRequerirMetodo")) {
    function ironixRequerirMetodo($metodosPermitidos)
    {
        if (!is_array($metodosPermitidos)) {
            $metodosPermitidos = [$metodosPermitidos];
        }

        $metodoActual = $_SERVER["REQUEST_METHOD"] ?? "";

        if (!in_array($metodoActual, $metodosPermitidos, true)) {
            ironixResponderMetodoNoPermitido($metodosPermitidos);
        }

        return true;
    }
}


/* =========================
   CERRAR SESIÓN
========================= */

if (!function_exists("ironixCerrarSesion")) {
    function ironixCerrarSesion()
    {
        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();

            setcookie(session_name(), "", [
                "expires" => time() - 42000,
                "path" => $params["path"] ?? "/",
                "domain" => $params["domain"] ?? "",
                "secure" => $params["secure"] ?? false,
                "httponly" => $params["httponly"] ?? true,
                "samesite" => $params["samesite"] ?? "Lax"
            ]);
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
    }
}


/* =========================
   VALIDAR EXPIRACIÓN DE SESIÓN
========================= */
if (!function_exists("ironixValidarSesionActiva")) {
    function ironixValidarSesionActiva()
    {
        $usuarioId = intval($_SESSION["ironix_usuario_id"] ?? 0);

        if ($usuarioId <= 0) {
            ironixCerrarSesion();
            return false;
        }

        $estadoSesion = strtolower(trim($_SESSION["ironix_usuario_estado"] ?? "activa"));

        /*
            Fase 5:
            Si la sesión ya fue marcada como bloqueada, inactiva o inválida,
            no debe seguir pasando como sesión válida.
        */
        if ($estadoSesion !== "activa") {
            ironixCerrarSesion();
            return false;
        }

        $ultimaActividad = intval($_SESSION["ironix_ultima_actividad"] ?? 0);

        if ($ultimaActividad <= 0) {
            ironixCerrarSesion();
            return false;
        }

        $tiempoInactivo = time() - $ultimaActividad;

        if ($tiempoInactivo > IRONIX_SESSION_TIMEOUT) {
            ironixCerrarSesion();
            return false;
        }

        $_SESSION["ironix_ultima_actividad"] = time();

        return true;
    }
}


/* =========================
   ACTUALIZAR ACTIVIDAD
========================= */

if (!function_exists("ironixActualizarActividadSesion")) {
    function ironixActualizarActividadSesion()
    {
        if (isset($_SESSION["ironix_usuario_id"])) {
            $_SESSION["ironix_ultima_actividad"] = time();
        }
    }
}


/* =========================
   CREAR SESIÓN DE USUARIO
========================= */

if (!function_exists("ironixCrearSesionUsuario")) {
    function ironixCrearSesionUsuario($usuario)
    {
        session_regenerate_id(true);

        $_SESSION["ironix_usuario_id"] = intval($usuario["id"] ?? 0);
        $_SESSION["ironix_usuario_nombre"] = trim($usuario["nombre"] ?? "");
        $_SESSION["ironix_usuario_correo"] = trim($usuario["correo"] ?? "");
        $_SESSION["ironix_usuario_rol"] = strtolower(trim($usuario["rol"] ?? "usuario"));
        $_SESSION["ironix_usuario_estado"] = strtolower(trim($usuario["estado"] ?? "activa"));
        $_SESSION["ironix_ultima_actividad"] = time();

        /*
            Permisos opcionales para frontend o uso auxiliar.

            La validación backend principal se hace en guard.php.
        */
        if (isset($usuario["permisos"])) {
            if (is_array($usuario["permisos"])) {
                $_SESSION["ironix_usuario_permisos"] = $usuario["permisos"];
            } else {
                $permisosDecodificados = json_decode($usuario["permisos"], true);

                $_SESSION["ironix_usuario_permisos"] = is_array($permisosDecodificados)
                    ? $permisosDecodificados
                    : [];
            }
        } else {
            $_SESSION["ironix_usuario_permisos"] = [];
        }
    }
}


/* =========================
   OBTENER USUARIO DE SESIÓN
========================= */

if (!function_exists("ironixObtenerUsuarioSesion")) {
    function ironixObtenerUsuarioSesion()
    {
        if (!ironixValidarSesionActiva()) {
            return null;
        }

        return [
            "id" => intval($_SESSION["ironix_usuario_id"] ?? 0),
            "nombre" => $_SESSION["ironix_usuario_nombre"] ?? "",
            "correo" => $_SESSION["ironix_usuario_correo"] ?? "",
            "rol" => $_SESSION["ironix_usuario_rol"] ?? "usuario",
            "estado" => $_SESSION["ironix_usuario_estado"] ?? "activa",
            "permisos" => $_SESSION["ironix_usuario_permisos"] ?? []
        ];
    }
}


/* =========================
   GUARD - REQUERIR SESIÓN
========================= */

if (!function_exists("ironixRequerirSesion")) {
    function ironixRequerirSesion()
    {
        $usuario = ironixObtenerUsuarioSesion();

        if (!$usuario || intval($usuario["id"] ?? 0) <= 0) {
            ironixResponderNoAutorizado("Sesión no válida o expirada");
        }

        return $usuario;
    }
}


/* =========================
   VALIDAR SI ES ADMIN
========================= */

if (!function_exists("ironixUsuarioEsAdmin")) {
    function ironixUsuarioEsAdmin()
    {
        if (!ironixValidarSesionActiva()) {
            return false;
        }

        $rolActual = strtolower(trim($_SESSION["ironix_usuario_rol"] ?? ""));

        return $rolActual === "admin";
    }
}

/* =========================
   GUARD - REQUERIR ROL
========================= */
if (!function_exists("ironixRequerirRol")) {
    function ironixRequerirRol($rolesPermitidos)
    {
        ironixRequerirSesion();

        if (!is_array($rolesPermitidos)) {
            $rolesPermitidos = [$rolesPermitidos];
        }

        $rolesNormalizados = array_map(function ($rol) {
            return strtolower(trim((string) $rol));
        }, $rolesPermitidos);

        $rolActual = strtolower(trim($_SESSION["ironix_usuario_rol"] ?? "usuario"));

        if (!in_array($rolActual, $rolesNormalizados, true)) {
            ironixResponderSinPermisos("Tu rol no tiene acceso a esta acción");
        }

        return true;
    }
}