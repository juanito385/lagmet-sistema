<?php

/* =========================
   IRONIX - GUARD GENERAL
========================= */

/*
    Este archivo protege endpoints PHP.

    Funciones principales:
    - Valida sesión activa.
    - Expone datos del usuario autenticado.
    - Permite validar permisos por sección y acción.
    - Entrega respuestas JSON estándar para 401 y 403.
*/

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/session_config.php";


/* =========================
   RESPUESTAS ESTÁNDAR
========================= */

if (!function_exists("ironixResponderNoAutorizado")) {
    function ironixResponderNoAutorizado($mensaje = "No autorizado") {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            "success" => false,
            "auth" => false,
            "message" => $mensaje
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }
}

if (!function_exists("ironixResponderSinPermisos")) {
    function ironixResponderSinPermisos($mensaje = "No tienes permisos para realizar esta acción") {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            "success" => false,
            "auth" => true,
            "permission" => false,
            "message" => $mensaje
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }
}


/* =========================
   VALIDAR SESIÓN ACTIVA
========================= */

if (!ironixValidarSesionActiva()) {
    ironixResponderNoAutorizado("Sesión no iniciada o expirada");
}


/* =========================
   USUARIO AUTENTICADO
========================= */

$IRONIX_USER_ID = $_SESSION["ironix_usuario_id"] ?? null;
$IRONIX_USER_NAME = $_SESSION["ironix_usuario_nombre"] ?? "";
$IRONIX_USER_EMAIL = $_SESSION["ironix_usuario_correo"] ?? "";
$IRONIX_USER_ROLE = $_SESSION["ironix_usuario_rol"] ?? "usuario";

$IRONIX_USER_ID = intval($IRONIX_USER_ID);

if ($IRONIX_USER_ID <= 0) {
    ironixResponderNoAutorizado("Sesión inválida");
}


/* =========================
   MATRIZ DE PERMISOS BACKEND
========================= */

$IRONIX_PERMISOS_BACKEND = [

    "admin" => [

        "dashboard" => [
            "ver"
        ],

        "productos" => [
            "ver",
            "crear",
            "editar",
            "eliminar",
            "exportar"
        ],

        "documentacion" => [
            "ver",
            "exportar",
            "exportar_imagen",
            "exportar_excel",
            "exportar_pdf",
            "generar_informe_pdf"
        ],

        "configuracion" => [
            "ver",
            "crear",
            "editar",
            "eliminar",
            "crear_usuario",
            "editar_usuario",
            "eliminar_usuario",
            "permisos",
            "seguridad"
        ],

        "monitoreo" => [
            "ver",
            "crear",
            "editar",
            "guardar",
            "eliminar",
            "exportar"
        ],

        "produccion" => [
            "ver",
            "crear",
            "editar",
            "guardar",
            "eliminar"
        ],

        "flujo_proceso" => [
            "ver",
            "exportar",
            "exportar_imagen",
            "exportar_pdf"
        ],

        "estados" => [
            "ver",
            "crear",
            "editar",
            "eliminar",
            "exportar"
        ],

        "perfil" => [
            "ver",
            "editar",
            "cambiar_password"
        ]
    ],

    "usuario" => [

        "dashboard" => [
            "ver"
        ],

        "productos" => [
            "ver"
        ],

        "documentacion" => [
            "ver"
        ],

        "monitoreo" => [
            "ver"
        ],

        "produccion" => [
            "ver"
        ],

        "flujo_proceso" => [
            "ver"
        ],

        "estados" => [
            "ver"
        ],

        "perfil" => [
            "ver",
            "editar",
            "cambiar_password"
        ]
    ]
];


/* =========================
   VALIDAR PERMISO
========================= */

if (!function_exists("ironixTienePermiso")) {
    function ironixTienePermiso($seccion, $accion) {
        global $IRONIX_PERMISOS_BACKEND;
        global $IRONIX_USER_ROLE;

        $rol = $IRONIX_USER_ROLE ?? "usuario";

        if (!isset($IRONIX_PERMISOS_BACKEND[$rol])) {
            return false;
        }

        if (!isset($IRONIX_PERMISOS_BACKEND[$rol][$seccion])) {
            return false;
        }

        return in_array($accion, $IRONIX_PERMISOS_BACKEND[$rol][$seccion], true);
    }
}


/* =========================
   REQUERIR PERMISO
========================= */

if (!function_exists("ironixRequerirPermiso")) {
    function ironixRequerirPermiso($seccion, $accion) {
        if (!ironixTienePermiso($seccion, $accion)) {
            ironixResponderSinPermisos("No tienes permisos para {$seccion} / {$accion}");
        }

        return true;
    }
}


/* =========================
   REQUERIR ROL
========================= */

if (!function_exists("ironixRequerirRol")) {
    function ironixRequerirRol($rolRequerido) {
        global $IRONIX_USER_ROLE;

        if (($IRONIX_USER_ROLE ?? null) !== $rolRequerido) {
            ironixResponderSinPermisos("Acceso restringido para rol {$rolRequerido}");
        }

        return true;
    }
}