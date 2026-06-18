<?php

/* =========================
   IRONIX - GUARD GENERAL
========================= */

/*
    Este archivo protege endpoints PHP.

    Funciones principales:
    - Valida sesión activa.
    - Revalida usuario contra la base de datos en cada request.
    - Bloquea usuarios eliminados, bloqueados o inactivos después del login.
    - Sincroniza sesión con datos actuales de BD.
    - Carga permisos reales desde usuario_permisos.
    - Permite validar permisos por sección y acción.
    - Entrega respuestas JSON estándar desde session_config.php.

    Importante:
    - session_config.php maneja sesión, headers, método y respuestas JSON.
    - guard.php maneja validación backend por sesión, estado y permisos.
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
   DATOS BASE DESDE SESIÓN
========================= */

$IRONIX_USER_ID = intval($IRONIX_USUARIO_SESION["id"] ?? 0);

if ($IRONIX_USER_ID <= 0) {
    ironixCerrarSesion();
    ironixResponderNoAutorizado("Sesión inválida");
}


/* =========================
   CONEXIÓN BD
========================= */

/*
    No se debe cerrar $conn dentro de este archivo.

    Motivo:
    Muchos endpoints cargan guard.php y luego usan la misma conexión
    para sus propias consultas.
*/

require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


/* =========================
   VARIABLES GLOBALES AUTH
========================= */

$IRONIX_USER_NAME = "";
$IRONIX_USER_EMAIL = "";
$IRONIX_USER_ROLE = "usuario";
$IRONIX_USER_STATE = "activa";
$IRONIX_PERMISOS_USUARIO = [];


/* =========================
   MÓDULOS DEL SISTEMA
========================= */

$IRONIX_MODULOS_SISTEMA = [
    "dashboard",
    "monitoreo",
    "productos",
    "documentacion",
    "flujo_proceso",
    "flujo-proceso",
    "estados",
    "perfil",
    "configuracion",
    "usuarios",
    "produccion",
    "maquinas"
];


/* =========================
   ACCIONES BASE DEL SISTEMA
========================= */

$IRONIX_ACCIONES_BASE = [
    "ver",
    "crear",
    "editar",
    "eliminar",
    "exportar"
];


/* =========================
   CREAR PERMISOS BASE
========================= */

if (!function_exists("ironixCrearPermisosBase")) {
    function ironixCrearPermisosBase()
    {
        global $IRONIX_MODULOS_SISTEMA;
        global $IRONIX_ACCIONES_BASE;

        $permisos = [];

        foreach ($IRONIX_MODULOS_SISTEMA as $modulo) {
            $permisos[$modulo] = [];

            foreach ($IRONIX_ACCIONES_BASE as $accion) {
                $permisos[$modulo][$accion] = false;
            }
        }

        return $permisos;
    }
}


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
   NORMALIZAR ACCIÓN
========================= */

if (!function_exists("ironixNormalizarAccionesPermiso")) {
    function ironixNormalizarAccionesPermiso($accion)
    {
        $accion = trim((string) $accion);

        /*
            Algunas acciones backend son más específicas que las columnas
            reales de usuario_permisos.

            Ejemplo:
            exportar_pdf, exportar_excel y exportar_imagen dependen
            del permiso base "exportar".
        */

        $alias = [
            "guardar" => ["crear", "editar"],
            "actualizar_estado" => ["editar"],

            "crear_usuario" => ["crear"],
            "editar_usuario" => ["editar"],
            "eliminar_usuario" => ["eliminar"],
            "restablecer_password" => ["editar"],

            "permisos" => ["editar"],
            "seguridad" => ["editar"],

            "cambiar_password" => ["editar"],

            "exportar_imagen" => ["exportar"],
            "exportar_excel" => ["exportar"],
            "exportar_pdf" => ["exportar"],
            "generar_informe_pdf" => ["exportar"]
        ];

        if (isset($alias[$accion])) {
            return $alias[$accion];
        }

        return [$accion];
    }
}


/* =========================
   SINCRONIZAR ALIAS FLUJO
========================= */

if (!function_exists("ironixSincronizarAliasFlujoProceso")) {
    function ironixSincronizarAliasFlujoProceso(&$permisos)
    {
        if (isset($permisos["flujo_proceso"])) {
            $permisos["flujo-proceso"] = $permisos["flujo_proceso"];
        }

        if (isset($permisos["flujo-proceso"])) {
            $permisos["flujo_proceso"] = $permisos["flujo-proceso"];
        }
    }
}


/* =========================
   ADMIN - PERMISOS TOTALES
========================= */

if (!function_exists("ironixCrearPermisosAdmin")) {
    function ironixCrearPermisosAdmin()
    {
        global $IRONIX_ACCIONES_BASE;

        $permisos = ironixCrearPermisosBase();

        foreach ($permisos as $modulo => $acciones) {
            foreach ($IRONIX_ACCIONES_BASE as $accion) {
                $permisos[$modulo][$accion] = true;
            }
        }

        ironixSincronizarAliasFlujoProceso($permisos);

        return $permisos;
    }
}


/* =========================
   CARGAR PERMISOS DESDE BD
========================= */

if (!function_exists("ironixCargarPermisosUsuarioDesdeBD")) {
    function ironixCargarPermisosUsuarioDesdeBD($usuarioId)
    {
        global $conn;

        $permisos = ironixCrearPermisosBase();

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
            $modulo = ironixNormalizarSeccionPermiso($permiso["modulo"] ?? "");

            if ($modulo === "" || !isset($permisos[$modulo])) {
                continue;
            }

            $permisos[$modulo] = [
                "ver" => intval($permiso["puede_ver"] ?? 0) === 1,
                "crear" => intval($permiso["puede_crear"] ?? 0) === 1,
                "editar" => intval($permiso["puede_editar"] ?? 0) === 1,
                "eliminar" => intval($permiso["puede_eliminar"] ?? 0) === 1,
                "exportar" => intval($permiso["puede_exportar"] ?? 0) === 1
            ];
        }

        $stmtPermisos->close();

        /*
            Perfil siempre debe estar disponible para el usuario autenticado.
        */
        $permisos["perfil"]["ver"] = true;
        $permisos["perfil"]["editar"] = true;

        ironixSincronizarAliasFlujoProceso($permisos);

        return $permisos;
    }
}


/* =========================
   REVALIDAR USUARIO CONTRA BD
========================= */

try {

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

    $stmtUsuario->bind_param("i", $IRONIX_USER_ID);

    if (!$stmtUsuario->execute()) {
        throw new Exception("Error al validar usuario: " . $stmtUsuario->error);
    }

    $resultUsuario = $stmtUsuario->get_result();

    if (!$resultUsuario || $resultUsuario->num_rows === 0) {
        $stmtUsuario->close();

        ironixCerrarSesion();

        ironixResponderNoAutorizado("Usuario no encontrado o sesión inválida");
    }
 
    $usuarioBD = $resultUsuario->fetch_assoc();

    $stmtUsuario->close();

    $IRONIX_USER_NAME = $usuarioBD["nombre"] ?? "Usuario";
    $IRONIX_USER_EMAIL = $usuarioBD["correo"] ?? "";
    $IRONIX_USER_ROLE = strtolower(trim($usuarioBD["rol"] ?? "usuario"));
    $IRONIX_USER_STATE = strtolower(trim($usuarioBD["estado"] ?? "activa"));

    /*
        Si el administrador bloquea o inactiva al usuario después del login,
        el próximo endpoint protegido lo detectará aquí.
    */
    if ($IRONIX_USER_STATE !== "activa") {
        ironixCerrarSesion();

        ironixResponderNoAutorizado("Tu cuenta ya no está activa. Contacta al administrador.");
    }

    /*
        Sincronizar sesión con BD.
        Esto cubre cambios de nombre, correo, rol o estado mientras está logueado.
    */
    $_SESSION["ironix_usuario_nombre"] = $IRONIX_USER_NAME;
    $_SESSION["ironix_usuario_correo"] = $IRONIX_USER_EMAIL;
    $_SESSION["ironix_usuario_rol"] = $IRONIX_USER_ROLE;
    $_SESSION["ironix_usuario_estado"] = $IRONIX_USER_STATE;

    /*
        Cargar permisos reales.
        Admin conserva acceso total.
        Usuarios normales dependen de usuario_permisos.
    */
    if ($IRONIX_USER_ROLE === "admin") {
        $IRONIX_PERMISOS_USUARIO = ironixCrearPermisosAdmin();
    } else {
        $IRONIX_PERMISOS_USUARIO = ironixCargarPermisosUsuarioDesdeBD($IRONIX_USER_ID);
    }

    $_SESSION["ironix_usuario_permisos"] = $IRONIX_PERMISOS_USUARIO;
    $_SESSION["ironix_ultima_actividad"] = time();

} catch (Throwable $e) {

    if (isset($stmtUsuario) && $stmtUsuario instanceof mysqli_stmt) {
        $stmtUsuario->close();
    }

    ironixResponderJson([
        "success" => false,
        "auth" => false,
        "message" => "Error al validar guard de sesión",
        "error" => $e->getMessage()
    ], 500);
}


/* =========================
   VALIDAR PERMISO
========================= */

if (!function_exists("ironixTienePermiso")) {
    function ironixTienePermiso($seccion, $accion)
    {
        global $IRONIX_USER_ROLE;
        global $IRONIX_PERMISOS_USUARIO;

        $seccion = ironixNormalizarSeccionPermiso($seccion);
        $accionesPosibles = ironixNormalizarAccionesPermiso($accion);

        if ($seccion === "" || empty($accionesPosibles)) {
            return false;
        }

        /*
            Admin:
            Acceso total a acciones reconocidas dentro de módulos del sistema.
        */
        if ($IRONIX_USER_ROLE === "admin") {
            if (!isset($IRONIX_PERMISOS_USUARIO[$seccion])) {
                return false;
            }

            foreach ($accionesPosibles as $accionBase) {
                if (isset($IRONIX_PERMISOS_USUARIO[$seccion][$accionBase])) {
                    return true;
                }
            }

            return false;
        }

        /*
            Usuario:
            Se valida contra permisos reales cargados desde usuario_permisos.
        */
        if (!isset($IRONIX_PERMISOS_USUARIO[$seccion])) {
            return false;
        }

        foreach ($accionesPosibles as $accionBase) {
            if (
                isset($IRONIX_PERMISOS_USUARIO[$seccion][$accionBase]) &&
                $IRONIX_PERMISOS_USUARIO[$seccion][$accionBase] === true
            ) {
                return true;
            }
        }

        return false;
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
        global $IRONIX_PERMISOS_USUARIO;

        return [
            "id" => intval($IRONIX_USER_ID),
            "nombre" => $IRONIX_USER_NAME,
            "correo" => $IRONIX_USER_EMAIL,
            "rol" => $IRONIX_USER_ROLE,
            "estado" => $IRONIX_USER_STATE,
            "permisos" => $IRONIX_PERMISOS_USUARIO
        ];
    }
}