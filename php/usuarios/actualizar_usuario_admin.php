<?php

/* =========================
   IRONIX - ACTUALIZAR USUARIO
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("configuracion", "editar_usuario");


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
   USUARIO ADMIN AUTENTICADO
========================= */

/*
    Seguridad Fase 3:
    No se recibe admin_id desde el frontend.
    Se usa el usuario autenticado por guard.php.
*/

$adminId = intval($IRONIX_USER_ID);


/* =========================
   RECIBIR DATOS
========================= */

$usuarioId = isset($_POST["usuario_id"]) ? intval($_POST["usuario_id"]) : 0;

$nombre = isset($_POST["nombre"]) ? trim($_POST["nombre"]) : "";
$correo = isset($_POST["correo"]) ? trim($_POST["correo"]) : "";
$rol = isset($_POST["rol"]) ? trim($_POST["rol"]) : "usuario";
$estado = isset($_POST["estado"]) ? trim($_POST["estado"]) : "activa";

$telefono = isset($_POST["telefono"]) ? trim($_POST["telefono"]) : "";
$area = isset($_POST["area"]) ? trim($_POST["area"]) : "Producción";
$idioma = isset($_POST["idioma"]) ? trim($_POST["idioma"]) : "Español / Chile";

$rolesPermitidos = ["admin", "usuario"];
$estadosPermitidos = ["activa", "inactiva", "bloqueada"];


/* =========================
   VALIDACIONES BÁSICAS
========================= */

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

if ($nombre === "" || $correo === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Completa nombre y correo"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Correo electrónico no válido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (!in_array($rol, $rolesPermitidos, true)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Rol no válido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (!in_array($estado, $estadosPermitidos, true)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Estado no válido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($area === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "El área no puede quedar vacía"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($idioma === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "El idioma no puede quedar vacío"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


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
        "message" => "Error al validar usuario"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtUsuario->bind_param("i", $usuarioId);
$stmtUsuario->execute();

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

$usuarioActual = $resultUsuario->fetch_assoc();
$stmtUsuario->close();


/* =========================
   PROTECCIONES ADMIN
========================= */

/*
    Evita que el admin se quite su propio rol.
*/

if ($adminId === $usuarioId && $rol !== "admin") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "No puedes quitarte tu propio rol de administrador"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

/*
    Evita que el admin se bloquee o desactive a sí mismo.
*/

if ($adminId === $usuarioId && $estado !== "activa") {
    http_response_code(403);

    echo json_encode([
        "success" => false,
        "message" => "No puedes bloquear o desactivar tu propia cuenta"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
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
        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => "Error al validar administradores activos"
        ], JSON_UNESCAPED_UNICODE);

        $conn->close();
        exit;
    }

    $stmtAdminsActivos->bind_param("i", $usuarioId);
    $stmtAdminsActivos->execute();

    $resultAdminsActivos = $stmtAdminsActivos->get_result();
    $rowAdminsActivos = $resultAdminsActivos->fetch_assoc();

    $totalAdminsActivos = intval($rowAdminsActivos["total"] ?? 0);

    $stmtAdminsActivos->close();

    if ($totalAdminsActivos <= 0) {
        http_response_code(403);

        echo json_encode([
            "success" => false,
            "message" => "No puedes dejar el sistema sin administradores activos"
        ], JSON_UNESCAPED_UNICODE);

        $conn->close();
        exit;
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
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al validar correo"
    ], JSON_UNESCAPED_UNICODE);

    $conn->close();
    exit;
}

$stmtCorreo->bind_param("si", $correo, $usuarioId);
$stmtCorreo->execute();

$resultCorreo = $stmtCorreo->get_result();

if ($resultCorreo && $resultCorreo->num_rows > 0) {
    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "El correo ya está registrado por otro usuario"
    ], JSON_UNESCAPED_UNICODE);

    $stmtCorreo->close();
    $conn->close();
    exit;
}

$stmtCorreo->close();


/* =========================
   ACTUALIZAR USUARIO
========================= */

$transaccionIniciada = false;

$conn->begin_transaction();
$transaccionIniciada = true;

try {

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
        throw new Exception("Error al preparar actualización");
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
        throw new Exception("Error al actualizar usuario");
    }

    $stmtUpdate->close();


    /* =========================
       AJUSTAR PERMISOS SI CAMBIÓ ROL
    ========================= */

    if ($usuarioActual["rol"] !== $rol) {

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
            throw new Exception("Error al preparar actualización de permisos");
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
                throw new Exception("Error al actualizar permisos del módulo: " . $modulo);
            }
        }

        $stmtPermiso->close();
    }


    /* =========================
       CONFIRMAR TRANSACCIÓN
    ========================= */

    $conn->commit();
    $transaccionIniciada = false;


    /* =========================
       RESPUESTA
    ========================= */

    echo json_encode([
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

$conn->close();