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

$usuarioId = isset($_POST["usuario_id"]) ? intval($_POST["usuario_id"]) : 0;
$permisosJson = isset($_POST["permisos"]) ? $_POST["permisos"] : "";

if ($usuarioId <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID de usuario no recibido"
    ]);
    exit;
}

if ($permisosJson === "") {
    echo json_encode([
        "success" => false,
        "message" => "Permisos no recibidos"
    ]);
    exit;
}

$permisosRecibidos = json_decode($permisosJson, true);

if (!is_array($permisosRecibidos)) {
    echo json_encode([
        "success" => false,
        "message" => "Formato de permisos inválido"
    ]);
    exit;
}

/* =========================
   MÓDULOS PERMITIDOS
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

/* =========================
   VALIDAR USUARIO
========================= */

$sqlUsuario = "
    SELECT id, rol
    FROM usuarios
    WHERE id = ?
    LIMIT 1
";

$stmtUsuario = $conn->prepare($sqlUsuario);

if (!$stmtUsuario) {
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar validación de usuario"
    ]);
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

$usuario = $resultUsuario->fetch_assoc();
$stmtUsuario->close();

/*
    Protección básica:
    El perfil siempre debe quedar visible.
*/
$permisosRecibidos["perfil"] = true;

/*
    Si el usuario es admin, mantenemos todos los módulos visibles.
    El admin no debería perder acceso desde permisos rápidos.
*/
if ($usuario["rol"] === "admin") {
    foreach ($modulosSistema as $modulo) {
        $permisosRecibidos[$modulo] = true;
    }
}

/* =========================
   GUARDAR PERMISOS
========================= */

$sql = "
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
    VALUES (?, ?, ?, 0, 0, 0, 0)
    ON DUPLICATE KEY UPDATE
        puede_ver = VALUES(puede_ver)
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar guardado de permisos"
    ]);
    exit;
}

$conn->begin_transaction();

try {
    foreach ($modulosSistema as $modulo) {
        $puedeVer = !empty($permisosRecibidos[$modulo]) ? 1 : 0;

        $stmt->bind_param(
            "isi",
            $usuarioId,
            $modulo,
            $puedeVer
        );

        if (!$stmt->execute()) {
            throw new Exception("Error al guardar permiso del módulo: " . $modulo);
        }
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Permisos actualizados correctamente"
    ]);

} catch (Exception $e) {
    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$stmt->close();
$conn->close();
?>