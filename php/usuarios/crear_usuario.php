<?php

/* =========================
   IRONIX - CREAR USUARIO
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("POST");
ironixRequerirPermiso("configuracion", "crear_usuario");


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

$nombre = isset($input["nombre"]) ? trim((string) $input["nombre"]) : "";
$correo = isset($input["correo"]) ? trim((string) $input["correo"]) : "";
$password = isset($input["password"]) ? trim((string) $input["password"]) : "";

$rol = isset($input["rol"]) ? trim((string) $input["rol"]) : "usuario";
$estado = isset($input["estado"]) ? trim((string) $input["estado"]) : "activa";

$telefono = isset($input["telefono"]) ? trim((string) $input["telefono"]) : "";
$area = isset($input["area"]) ? trim((string) $input["area"]) : "Producción";
$idioma = isset($input["idioma"]) ? trim((string) $input["idioma"]) : "Español / Chile";

$rolesPermitidos = ["admin", "usuario"];
$estadosPermitidos = ["activa", "inactiva", "bloqueada"];


/* =========================
   VALIDACIONES
========================= */

if ($nombre === "" || $correo === "" || $password === "") {
    ironixResponderJson([
        "success" => false,
        "message" => "Completa nombre, correo y contraseña"
    ], 400);
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    ironixResponderJson([
        "success" => false,
        "message" => "Correo electrónico no válido"
    ], 400);
}

if (strlen($password) < 6) {
    ironixResponderJson([
        "success" => false,
        "message" => "La contraseña debe tener al menos 6 caracteres"
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
        throw new Exception("Error al validar correo: " . $conn->error);
    }

    $stmtCorreo->bind_param("s", $correo);

    if (!$stmtCorreo->execute()) {
        throw new Exception("Error al ejecutar validación de correo: " . $stmtCorreo->error);
    }

    $resultCorreo = $stmtCorreo->get_result();

    if ($resultCorreo && $resultCorreo->num_rows > 0) {
        $stmtCorreo->close();
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "El correo ya está registrado"
        ], 409);
    }

    $stmtCorreo->close();


    /* =========================
       CREAR USUARIO + PERMISOS
    ========================= */

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $conn->begin_transaction();
    $transaccionIniciada = true;


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
        throw new Exception("Error al preparar creación de usuario: " . $conn->error);
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
        throw new Exception("Error al crear usuario: " . $stmtInsert->error);
    }

    $nuevoUsuarioId = $stmtInsert->insert_id;
    $stmtInsert->close();

    if ($nuevoUsuarioId <= 0) {
        throw new Exception("No se pudo obtener el ID del usuario creado");
    }


    /* =========================
       PERMISOS INICIALES
    ========================= */

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
    ";

    $stmtPermiso = $conn->prepare($sqlPermiso);

    if (!$stmtPermiso) {
        throw new Exception("Error al preparar permisos iniciales: " . $conn->error);
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
            throw new Exception("Error al crear permisos del módulo: " . $modulo . " - " . $stmtPermiso->error);
        }
    }

    $stmtPermiso->close();


    /* =========================
       CONFIRMAR TRANSACCIÓN
    ========================= */

    $conn->commit();
    $transaccionIniciada = false;

    $conn->close();

    ironixResponderJson([
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
    ], 200);

} catch (Throwable $e) {

    if ($transaccionIniciada && isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }

    if (isset($stmtCorreo) && $stmtCorreo instanceof mysqli_stmt) {
        $stmtCorreo->close();
    }

    if (isset($stmtInsert) && $stmtInsert instanceof mysqli_stmt) {
        $stmtInsert->close();
    }

    if (isset($stmtPermiso) && $stmtPermiso instanceof mysqli_stmt) {
        $stmtPermiso->close();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => $e->getMessage()
    ], 500);
}