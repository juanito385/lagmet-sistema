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
        En localhost usamos secure = false porque normalmente trabajas con http://localhost.
        En producción con HTTPS debería ser true.
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
define("IRONIX_SESSION_TIMEOUT", 7200);


/* =========================
   VALIDAR EXPIRACIÓN DE SESIÓN
========================= */

function ironixValidarSesionActiva()
{
    if (!isset($_SESSION["ironix_usuario_id"])) {
        return false;
    }

    if (!isset($_SESSION["ironix_ultima_actividad"])) {
        return false;
    }

    $tiempoInactivo = time() - $_SESSION["ironix_ultima_actividad"];

    if ($tiempoInactivo > IRONIX_SESSION_TIMEOUT) {
        ironixCerrarSesion();
        return false;
    }

    $_SESSION["ironix_ultima_actividad"] = time();

    return true;
}


/* =========================
   CREAR SESIÓN DE USUARIO
========================= */

function ironixCrearSesionUsuario($usuario)
{
    session_regenerate_id(true);

    $_SESSION["ironix_usuario_id"] = $usuario["id"];
    $_SESSION["ironix_usuario_nombre"] = $usuario["nombre"] ?? "";
    $_SESSION["ironix_usuario_correo"] = $usuario["correo"] ?? "";
    $_SESSION["ironix_usuario_rol"] = $usuario["rol"] ?? "usuario";
    $_SESSION["ironix_ultima_actividad"] = time();
}


/* =========================
   CERRAR SESIÓN
========================= */

function ironixCerrarSesion()
{
    $_SESSION = [];

    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();

        setcookie(
            session_name(),
            "",
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    session_destroy();
}


/* =========================
   RESPUESTA JSON NO AUTORIZADA
========================= */

function ironixResponderNoAutorizado($mensaje = "No autorizado")
{
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "auth" => false,
        "message" => $mensaje
    ]);

    exit;
}


/* =========================
   RESPUESTA JSON SIN PERMISOS
========================= */

function ironixResponderSinPermisos($mensaje = "No tienes permisos para realizar esta acción")
{
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "auth" => true,
        "permission" => false,
        "message" => $mensaje
    ]);

    exit;
}