<?php

/* =========================
   IRONIX - ACTUALIZAR USUARIO ADMIN
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("POST");
ironixRequerirPermiso("configuracion", "editar_usuario");


/* =========================
   USUARIO ADMIN AUTENTICADO
========================= */

/*
    Seguridad Fase 4:
    No se recibe admin_id desde el frontend.
    Se usa el usuario autenticado por guard.php.
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

$nombre = isset($input["nombre"]) ? trim((string) $input["nombre"]) : "";
$correo = isset($input["correo"]) ? trim((string) $input["correo"]) : "";
$rol = isset($input["rol"]) ? trim((string) $input["rol"]) : "usuario";
$estado = isset($input["estado"]) ? trim((string) $input["estado"]) : "activa";

$telefono = isset($input["telefono"]) ? trim((string) $input["telefono"]) : "";
$area = isset($input["area"]) ? trim((string) $input["area"]) : "Producción";
$idioma = isset($input["idioma"]) ? trim((string) $input["idioma"]) : "Español / Chile";

$rolesPermitidos = ["admin", "usuario"];
$estadosPermitidos = ["activa", "inactiva", "bloqueada"];


/* =========================
   VALIDACIONES BÁSICAS
========================= */

if ($usuarioId <= 0) {
    ironixResponderJson([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ], 400);
}

if ($nombre === "" || $correo === "") {
    ironixResponderJson([
        "success" => false,
        "message" => "Completa nombre y correo"
    ], 400);
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    ironixResponderJson([
        "success" => false,
        "message" => "Correo electrónico no válido"
    ], 400);
}

if (!in_array($rol, $rolesPermitidos, true)) {
    ironixResponderJson([
        "success" => false,
        "message" => "Rol no válido"
    ], 400);
}

if (!in_array($estado, $estadosPermitidos, true)) {
    ironixResponderJson([
        "success" => false,
        "message" => "Estado no válido"
    ], 400);
}

if ($area === "") {
    ironixResponderJson([
        "success" => false,
        "message" => "El área no puede quedar vacía"
    ], 400);
}

if ($idioma === "") {
    ironixResponderJson([
        "success" => false,
        "message" => "El idioma no puede quedar vacío"
    ], 400);
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
        throw new Exception("Error al validar usuario: " . $conn->error);
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

    $usuarioActual = $resultUsuario->fetch_assoc();
    $stmtUsuario->close();


    /* =========================
       PROTECCIONES ADMIN
    ========================= */

    /*
        Evita que el admin se quite su propio rol.
    */

    if ($adminId === $usuarioId && $rol !== "admin") {
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "No puedes quitarte tu propio rol de administrador"
        ], 403);
    }

    /*
        Evita que el admin se bloquee o desactive a sí mismo.
    */

    if ($adminId === $usuarioId && $estado !== "activa") {
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "No puedes bloquear o desactivar tu propia cuenta"
        ], 403);
    }

    /*
        Evita dejar el sistema sin ningún administrador activo.
    */

    $seEstaQuitandoAdminActivo = (
        $usuarioActual["rol"] === "admin" &&
        (
            $rol !== "admin" ||
            $estado !== "activa"
        )
    );

    if ($seEstaQuitandoAdminActivo) {
        $sqlAdminsActivos = "
            SELECT COUNT(*) AS total
            FROM usuarios
            WHERE rol = 'admin'
            AND estado = 'activa'
            AND id <> ?
        ";

        $stmtAdminsActivos = $conn->prepare($sqlAdminsActivos);

        if (!$stmtAdminsActivos) {
            throw new Exception("Error al validar administradores activos: " . $conn->error);
        }

        $stmtAdminsActivos->bind_param("i", $usuarioId);

        if (!$stmtAdminsActivos->execute()) {
            throw new Exception("Error al ejecutar validación de administradores activos: " . $stmtAdminsActivos->error);
        }

        $resultAdminsActivos = $stmtAdminsActivos->get_result();
        $rowAdminsActivos = $resultAdminsActivos ? $resultAdminsActivos->fetch_assoc() : null;

        $totalAdminsActivos = intval($rowAdminsActivos["total"] ?? 0);

        $stmtAdminsActivos->close();

        if ($totalAdminsActivos <= 0) {
            $conn->close();

            ironixResponderJson([
                "success" => false,
                "message" => "No puedes dejar el sistema sin administradores activos"
            ], 403);
        }
    }


    /* =========================
       VALIDAR CORREO DUPLICADO
    ========================= */

    $sqlCorreo = "
        SELECT id
        FROM usuarios
        WHERE correo = ?
        AND id <> ?
        LIMIT 1
    ";

    $stmtCorreo = $conn->prepare($sqlCorreo);

    if (!$stmtCorreo) {
        throw new Exception("Error al validar correo: " . $conn->error);
    }

    $stmtCorreo->bind_param("si", $correo, $usuarioId);

    if (!$stmtCorreo->execute()) {
        throw new Exception("Error al ejecutar validación de correo: " . $stmtCorreo->error);
    }

    $resultCorreo = $stmtCorreo->get_result();

    if ($resultCorreo && $resultCorreo->num_rows > 0) {
        $stmtCorreo->close();
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "El correo ya está registrado por otro usuario"
        ], 409);
    }

    $stmtCorreo->close();


    /* =========================
       ACTUALIZAR USUARIO
    ========================= */

    $conn->begin_transaction();
    $transaccionIniciada = true;

    $sqlUpdate = "
        UPDATE usuarios
        SET
            nombre = ?,
            correo = ?,
            rol = ?,
            telefono = ?,
            area = ?,
            idioma = ?,
            estado = ?
        WHERE id = ?
    ";

    $stmtUpdate = $conn->prepare($sqlUpdate);

    if (!$stmtUpdate) {
        throw new Exception("Error al preparar actualización: " . $conn->error);
    }

    $stmtUpdate->bind_param(
        "sssssssi",
        $nombre,
        $correo,
        $rol,
        $telefono,
        $area,
        $idioma,
        $estado,
        $usuarioId
    );

    if (!$stmtUpdate->execute()) {
        throw new Exception("Error al actualizar usuario: " . $stmtUpdate->error);
    }

    $stmtUpdate->close();


    /* =========================
       AJUSTAR PERMISOS SI CAMBIÓ ROL
    ========================= */

    if ($usuarioActual["rol"] !== $rol) {

        /*
            Nota:
            Se mantienen los nombres de módulos actuales de la tabla usuario_permisos.
            En frontend ya se usa "flujo-proceso" con guion.
        */

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

        $permisosAdmin = [
            "dashboard" => true,
            "monitoreo" => true,
            "productos" => true,
            "documentacion" => true,
            "flujo-proceso" => true,
            "estados" => true,
            "perfil" => true,
            "configuracion" => true
        ];

        $permisosUsuario = [
            "dashboard" => true,
            "monitoreo" => true,
            "productos" => true,
            "documentacion" => false,
            "flujo-proceso" => true,
            "estados" => true,
            "perfil" => true,
            "configuracion" => false
        ];

        $permisosBase = $rol === "admin" ? $permisosAdmin : $permisosUsuario;

        $sqlPermiso = "
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

        $stmtPermiso = $conn->prepare($sqlPermiso);

        if (!$stmtPermiso) {
            throw new Exception("Error al preparar actualización de permisos: " . $conn->error);
        }

        foreach ($modulosSistema as $modulo) {
            $puedeVer = !empty($permisosBase[$modulo]) ? 1 : 0;

            if ($rol === "admin") {
                $puedeCrear = 1;
                $puedeEditar = 1;
                $puedeEliminar = 1;
                $puedeExportar = 1;
            } else {
                $puedeCrear = in_array($modulo, ["monitoreo", "perfil"], true) ? 1 : 0;
                $puedeEditar = in_array($modulo, ["monitoreo", "estados", "perfil"], true) ? 1 : 0;
                $puedeEliminar = 0;
                $puedeExportar = 0;
            }

            $stmtPermiso->bind_param(
                "isiiiii",
                $usuarioId,
                $modulo,
                $puedeVer,
                $puedeCrear,
                $puedeEditar,
                $puedeEliminar,
                $puedeExportar
            );

            if (!$stmtPermiso->execute()) {
                throw new Exception("Error al actualizar permisos del módulo: " . $modulo . " - " . $stmtPermiso->error);
            }
        }

        $stmtPermiso->close();
    }


    /* =========================
       ACTUALIZAR SESIÓN SI EL ADMIN SE EDITÓ A SÍ MISMO
    ========================= */

    if ($adminId === $usuarioId) {
        $_SESSION["ironix_usuario_nombre"] = $nombre;
        $_SESSION["ironix_usuario_correo"] = $correo;
        $_SESSION["ironix_usuario_rol"] = $rol;
    }


    /* =========================
       CONFIRMAR TRANSACCIÓN
    ========================= */

    $conn->commit();
    $transaccionIniciada = false;

    $conn->close();


    /* =========================
       RESPUESTA
    ========================= */

    ironixResponderJson([
        "success" => true,
        "message" => "Usuario actualizado correctamente",
        "usuario" => [
            "id" => $usuarioId,
            "nombre" => $nombre,
            "correo" => $correo,
            "rol" => $rol,
            "telefono" => $telefono,
            "area" => $area,
            "idioma" => $idioma,
            "estado" => $estado
        ]
    ], 200);

} catch (Throwable $e) {

    if ($transaccionIniciada && isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => $e->getMessage()
    ], 500);
}