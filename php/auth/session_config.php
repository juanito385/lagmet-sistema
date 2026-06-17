<?php

/* =========================
   IRONIX - CONFIGURACIÓN DE SESIÓN
========================= */

/*
    Este archivo centraliza la configuración de sesión.
    Debe incluirse antes de usar $_SESSION.
*/

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
   VALIDAR EXPIRACIÓN DE SESIÓN
========================= */

if (!function_exists("ironixValidarSesionActiva")) {
    function ironixValidarSesionActiva()
    {
        if (!isset($_SESSION["ironix_usuario_id"])) {
            return false;
        }

        if (!isset($_SESSION["ironix_ultima_actividad"])) {
            return false;
        }

        $tiempoInactivo = time() - intval($_SESSION["ironix_ultima_actividad"]);

        if ($tiempoInactivo > IRONIX_SESSION_TIMEOUT) {
            ironixCerrarSesion();
            return false;
        }

        $_SESSION["ironix_ultima_actividad"] = time();

        return true;
    }
}


/* =========================
   CREAR SESIÓN DE USUARIO
========================= */

if (!function_exists("ironixCrearSesionUsuario")) {
    function ironixCrearSesionUsuario($usuario)
    {
        session_regenerate_id(true);

        $_SESSION["ironix_usuario_id"] = intval($usuario["id"]);
        $_SESSION["ironix_usuario_nombre"] = $usuario["nombre"] ?? "";
        $_SESSION["ironix_usuario_correo"] = $usuario["correo"] ?? "";
        $_SESSION["ironix_usuario_rol"] = $usuario["rol"] ?? "usuario";
        $_SESSION["ironix_ultima_actividad"] = time();
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
   RESPUESTA JSON NO AUTORIZADA
========================= */

if (!function_exists("ironixResponderNoAutorizado")) {
    function ironixResponderNoAutorizado($mensaje = "No autorizado")
    {
        http_response_code(401);
        header("Content-Type: application/json; charset=utf-8");

        echo json_encode([
            "success" => false,
            "auth" => false,
            "message" => $mensaje
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }
}


/* =========================
   RESPUESTA JSON SIN PERMISOS
========================= */

if (!function_exists("ironixResponderSinPermisos")) {
    function ironixResponderSinPermisos($mensaje = "No tienes permisos para realizar esta acción")
    {
        http_response_code(403);
        header("Content-Type: application/json; charset=utf-8");

        echo json_encode([
            "success" => false,
            "auth" => true,
            "permission" => false,
            "message" => $mensaje
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }
}