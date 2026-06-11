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
    echo json_encode([
        "success" => false,
        "message" => "ID de administrador no recibido"
    ]);
    exit;
}

if ($usuarioId <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ]);
    exit;
}

if ($nombre === "" || $correo === "") {
    echo json_encode([
        "success" => false,
        "message" => "Completa nombre y correo"
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
   VALIDAR ADMINISTRADOR
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
        "message" => "No tienes permisos para editar usuarios"
    ]);
    $conn->close();
    exit;
}

/* =========================
   VALIDAR USUARIO OBJETIVO
========================= */

$sqlUsuario = "
    SELECT id, nombre, correo, rol
    FROM usuarios
    WHERE id = ?
    LIMIT 1
";

$stmtUsuario = $conn->prepare($sqlUsuario);

if (!$stmtUsuario) {
    echo json_encode([
        "success" => false,
        "message" => "Error al validar usuario"
    ]);
    $conn->close();
    exit;
}

$stmtUsuario->bind_param("i", $usuarioId);
$stmtUsuario->execute();

$resultUsuario = $stmtUsuario->get_result();

if (!$resultUsuario || $resultUsuario->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado"
    ]);
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
    echo json_encode([
        "success" => false,
        "message" => "No puedes quitarte tu propio rol de administrador"
    ]);
    $conn->close();
    exit;
}

/*
    Evita que el admin se bloquee o desactive a sí mismo.
*/
if ($adminId === $usuarioId && $estado !== "activa") {
    echo json_encode([
        "success" => false,
        "message" => "No puedes bloquear o desactivar tu propia cuenta"
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
    AND id <> ?
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

$stmtCorreo->bind_param("si", $correo, $usuarioId);
$stmtCorreo->execute();

$resultCorreo = $stmtCorreo->get_result();

if ($resultCorreo && $resultCorreo->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "El correo ya está registrado por otro usuario"
    ]);
    $stmtCorreo->close();
    $conn->close();
    exit;
}

$stmtCorreo->close();

/* =========================
   ACTUALIZAR USUARIO
========================= */

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
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar actualización"
    ]);
    $conn->close();
    exit;
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
    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar usuario"
    ]);
    $stmtUpdate->close();
    $conn->close();
    exit;
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

    if ($stmtPermiso) {
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
                $usuarioId,
                $modulo,
                $puedeVer,
                $puedeCrear,
                $puedeEditar,
                $puedeEliminar,
                $puedeExportar
            );

            $stmtPermiso->execute();
        }

        $stmtPermiso->close();
    }
}

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
]);

$conn->close();
?>