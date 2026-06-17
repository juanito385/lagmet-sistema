<?php

/* =========================
   IRONIX - CREAR USUARIO
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("configuracion", "crear_usuario");


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

$nombre = isset($_POST["nombre"]) ? trim($_POST["nombre"]) : "";
$correo = isset($_POST["correo"]) ? trim($_POST["correo"]) : "";
$password = isset($_POST["password"]) ? trim($_POST["password"]) : "";

$rol = isset($_POST["rol"]) ? trim($_POST["rol"]) : "usuario";
$estado = isset($_POST["estado"]) ? trim($_POST["estado"]) : "activa";

$telefono = isset($_POST["telefono"]) ? trim($_POST["telefono"]) : "";
$area = isset($_POST["area"]) ? trim($_POST["area"]) : "Producción";
$idioma = isset($_POST["idioma"]) ? trim($_POST["idioma"]) : "Español / Chile";

$rolesPermitidos = ["admin", "usuario"];
$estadosPermitidos = ["activa", "inactiva", "bloqueada"];


/* =========================
   VALIDACIONES
========================= */

if ($adminId <= 0) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Administrador autenticado no válido"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($nombre === "" || $correo === "" || $password === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Completa nombre, correo y contraseña"
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

if (strlen($password) < 6) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "La contraseña debe tener al menos 6 caracteres"
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
   VALIDAR CORREO DUPLICADO
========================= */

$sqlCorreo = "
    SELECT id
    FROM usuarios
    WHERE correo = ?
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

$stmtCorreo->bind_param("s", $correo);
$stmtCorreo->execute();

$resultCorreo = $stmtCorreo->get_result();

if ($resultCorreo && $resultCorreo->num_rows > 0) {
    http_response_code(409);

    echo json_encode([
        "success" => false,
        "message" => "El correo ya está registrado"
    ], JSON_UNESCAPED_UNICODE);

    $stmtCorreo->close();
    $conn->close();
    exit;
}

$stmtCorreo->close();


/* =========================
   CREAR USUARIO + PERMISOS
========================= */

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$conn->begin_transaction();

try {

    /* =========================
       INSERTAR USUARIO
    ========================= */

    $sqlInsert = "
        INSERT INTO usuarios
        (
            nombre,
            correo,
            password,
            rol,
            telefono,
            area,
            idioma,
            estado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $stmtInsert = $conn->prepare($sqlInsert);

    if (!$stmtInsert) {
        throw new Exception("Error al preparar creación de usuario");
    }

    $stmtInsert->bind_param(
        "ssssssss",
        $nombre,
        $correo,
        $passwordHash,
        $rol,
        $telefono,
        $area,
        $idioma,
        $estado
    );

    if (!$stmtInsert->execute()) {
        throw new Exception("Error al crear usuario");
    }

    $nuevoUsuarioId = $stmtInsert->insert_id;
    $stmtInsert->close();


    /* =========================
       PERMISOS INICIALES
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
    ";

    $stmtPermiso = $conn->prepare($sqlPermiso);

    if (!$stmtPermiso) {
        throw new Exception("Error al preparar permisos iniciales");
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
            $nuevoUsuarioId,
            $modulo,
            $puedeVer,
            $puedeCrear,
            $puedeEditar,
            $puedeEliminar,
            $puedeExportar
        );

        if (!$stmtPermiso->execute()) {
            throw new Exception("Error al crear permisos del módulo: " . $modulo);
        }
    }

    $stmtPermiso->close();


    /* =========================
       CONFIRMAR TRANSACCIÓN
    ========================= */

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Usuario creado correctamente",
        "usuario" => [
            "id" => $nuevoUsuarioId,
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

    $conn->rollback();

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

$conn->close();