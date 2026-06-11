<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . "/../conexion.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ]);
    exit;
}

/* =========================
   RECIBIR DATOS
========================= */

$adminId = isset($_POST["admin_id"]) ? intval($_POST["admin_id"]) : 0;

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
    echo json_encode([
        "success" => false,
        "message" => "ID de administrador no recibido"
    ]);
    exit;
}

if ($nombre === "" || $correo === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "Completa nombre, correo y contraseña"
    ]);
    exit;
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Correo electrónico no válido"
    ]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode([
        "success" => false,
        "message" => "La contraseña debe tener al menos 6 caracteres"
    ]);
    exit;
}

if (!in_array($rol, $rolesPermitidos)) {
    echo json_encode([
        "success" => false,
        "message" => "Rol no válido"
    ]);
    exit;
}

if (!in_array($estado, $estadosPermitidos)) {
    echo json_encode([
        "success" => false,
        "message" => "Estado no válido"
    ]);
    exit;
}

if ($area === "") {
    echo json_encode([
        "success" => false,
        "message" => "El área no puede quedar vacía"
    ]);
    exit;
}

if ($idioma === "") {
    echo json_encode([
        "success" => false,
        "message" => "El idioma no puede quedar vacío"
    ]);
    exit;
}

/* =========================
   VALIDAR ADMIN
========================= */

$sqlAdmin = "
    SELECT id, rol
    FROM usuarios
    WHERE id = ?
    LIMIT 1
";

$stmtAdmin = $conn->prepare($sqlAdmin);

if (!$stmtAdmin) {
    echo json_encode([
        "success" => false,
        "message" => "Error al validar administrador"
    ]);
    exit;
}

$stmtAdmin->bind_param("i", $adminId);
$stmtAdmin->execute();

$resultAdmin = $stmtAdmin->get_result();

if (!$resultAdmin || $resultAdmin->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Administrador no encontrado"
    ]);
    $stmtAdmin->close();
    $conn->close();
    exit;
}

$admin = $resultAdmin->fetch_assoc();
$stmtAdmin->close();

if ($admin["rol"] !== "admin") {
    echo json_encode([
        "success" => false,
        "message" => "No tienes permisos para crear usuarios"
    ]);
    $conn->close();
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
    echo json_encode([
        "success" => false,
        "message" => "Error al validar correo"
    ]);
    $conn->close();
    exit;
}

$stmtCorreo->bind_param("s", $correo);
$stmtCorreo->execute();

$resultCorreo = $stmtCorreo->get_result();

if ($resultCorreo && $resultCorreo->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "El correo ya está registrado"
    ]);
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
            $puedeCrear = in_array($modulo, ["monitoreo", "perfil"]) ? 1 : 0;
            $puedeEditar = in_array($modulo, ["monitoreo", "estados", "perfil"]) ? 1 : 0;
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
    ]);

} catch (Exception $e) {
    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>