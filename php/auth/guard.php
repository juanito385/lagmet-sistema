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
    - Entrega respuestas JSON estándar desde session_config.php.
    - Usa una matriz centralizada de permisos backend.

    Importante:
    - session_config.php maneja sesión, headers, método y respuestas JSON.
    - guard.php maneja permisos backend por rol.
*/

require_once __DIR__ . "/session_config.php";


/* =========================
   HEADERS JSON / NO CACHE
========================= */

ironixAplicarHeadersJson();


/* =========================
   VALIDAR SESIÓN ACTIVA
========================= */

$IRONIX_USUARIO_SESION = ironixRequerirSesion();


/* =========================
   USUARIO AUTENTICADO
========================= */

$IRONIX_USER_ID = intval($IRONIX_USUARIO_SESION["id"] ?? 0);
$IRONIX_USER_NAME = $IRONIX_USUARIO_SESION["nombre"] ?? "";
$IRONIX_USER_EMAIL = $IRONIX_USUARIO_SESION["correo"] ?? "";
$IRONIX_USER_ROLE = $IRONIX_USUARIO_SESION["rol"] ?? "usuario";
$IRONIX_USER_STATE = $IRONIX_USUARIO_SESION["estado"] ?? "activa";

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

        "usuarios" => [
            "ver",
            "crear",
            "editar",
            "eliminar",
            "permisos",
            "seguridad",
            "restablecer_password"
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

        /*
            Nombre usado por backend.
        */
        "flujo_proceso" => [
            "ver",
            "crear",
            "editar",
            "eliminar",
            "exportar",
            "exportar_imagen",
            "exportar_pdf"
        ],

        /*
            Alias compatible con nombre usado en frontend / BD.
        */
        "flujo-proceso" => [
            "ver",
            "crear",
            "editar",
            "eliminar",
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

        "maquinas" => [
            "ver",
            "editar",
            "actualizar_estado"
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

        "flujo-proceso" => [
            "ver"
        ],

        "estados" => [
            "ver"
        ],

        "maquinas" => [
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
   NORMALIZAR SECCIÓN
========================= */

if (!function_exists("ironixNormalizarSeccionPermiso")) {
    function ironixNormalizarSeccionPermiso($seccion)
    {
        $seccion = trim((string) $seccion);

        $alias = [
            "flujo-proceso" => "flujo_proceso"
        ];

        return $alias[$seccion] ?? $seccion;
    }
}


/* =========================
   VALIDAR PERMISO
========================= */

if (!function_exists("ironixTienePermiso")) {
    function ironixTienePermiso($seccion, $accion)
    {
        global $IRONIX_PERMISOS_BACKEND;
        global $IRONIX_USER_ROLE;

        $rol = $IRONIX_USER_ROLE ?? "usuario";
        $seccion = ironixNormalizarSeccionPermiso($seccion);
        $accion = trim((string) $accion);

        if ($rol === "" || $seccion === "" || $accion === "") {
            return false;
        }

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
    function ironixRequerirPermiso($seccion, $accion)
    {
        if (!ironixTienePermiso($seccion, $accion)) {
            ironixResponderSinPermisos("No tienes permisos para {$seccion} / {$accion}");
        }

        return true;
    }
}


/* =========================
   OBTENER USUARIO AUTENTICADO
========================= */

if (!function_exists("ironixObtenerUsuarioAutenticado")) {
    function ironixObtenerUsuarioAutenticado()
    {
        global $IRONIX_USER_ID;
        global $IRONIX_USER_NAME;
        global $IRONIX_USER_EMAIL;
        global $IRONIX_USER_ROLE;
        global $IRONIX_USER_STATE;

        return [
            "id" => intval($IRONIX_USER_ID),
            "nombre" => $IRONIX_USER_NAME,
            "correo" => $IRONIX_USER_EMAIL,
            "rol" => $IRONIX_USER_ROLE,
            "estado" => $IRONIX_USER_STATE
        ];
    }
}