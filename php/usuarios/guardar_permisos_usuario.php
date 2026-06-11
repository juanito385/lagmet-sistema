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
   MÓDULOS Y ACCIONES
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

$accionesDisponibles = [
    "dashboard" => ["ver"],

    "monitoreo" => ["ver", "crear", "editar", "eliminar", "exportar"],

    "productos" => ["ver", "crear", "editar", "eliminar", "exportar"],

    "documentacion" => ["ver", "exportar"],

    "flujo-proceso" => ["ver", "crear", "editar", "eliminar", "exportar"],

    "estados" => ["ver", "editar", "exportar"],

    "perfil" => ["ver", "editar"],

    "configuracion" => ["ver", "crear", "editar", "eliminar", "exportar"]
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

/* =========================
   HELPERS
========================= */

function permisoRecibido($permisos, $modulo, $accion) {
    if (!isset($permisos[$modulo])) {
        return false;
    }

    /*
        Compatibilidad con formato antiguo:
        "dashboard": true
    */
    if (is_bool($permisos[$modulo])) {
        return $accion === "ver" ? $permisos[$modulo] : false;
    }

    /*
        Formato nuevo:
        "productos": {
            "ver": true,
            "crear": true,
            "editar": true,
            "eliminar": false,
            "exportar": false
        }
    */
    if (is_array($permisos[$modulo])) {
        return !empty($permisos[$modulo][$accion]);
    }

    return false;
}

function accionDisponible($accionesDisponibles, $modulo, $accion) {
    if (!isset($accionesDisponibles[$modulo])) {
        return false;
    }

    return in_array($accion, $accionesDisponibles[$modulo]);
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
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        puede_ver = VALUES(puede_ver),
        puede_crear = VALUES(puede_crear),
        puede_editar = VALUES(puede_editar),
        puede_eliminar = VALUES(puede_eliminar),
        puede_exportar = VALUES(puede_exportar)
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

        /*
            Admin siempre mantiene acceso total.
        */
        if ($usuario["rol"] === "admin") {
            $puedeVer = 1;
            $puedeCrear = 1;
            $puedeEditar = 1;
            $puedeEliminar = 1;
            $puedeExportar = 1;
        } else {

            $puedeVer = permisoRecibido($permisosRecibidos, $modulo, "ver") ? 1 : 0;
            $puedeCrear = permisoRecibido($permisosRecibidos, $modulo, "crear") ? 1 : 0;
            $puedeEditar = permisoRecibido($permisosRecibidos, $modulo, "editar") ? 1 : 0;
            $puedeEliminar = permisoRecibido($permisosRecibidos, $modulo, "eliminar") ? 1 : 0;
            $puedeExportar = permisoRecibido($permisosRecibidos, $modulo, "exportar") ? 1 : 0;

            /*
                Acciones no disponibles para ese módulo quedan en 0.
            */
            if (!accionDisponible($accionesDisponibles, $modulo, "crear")) {
                $puedeCrear = 0;
            }

            if (!accionDisponible($accionesDisponibles, $modulo, "editar")) {
                $puedeEditar = 0;
            }

            if (!accionDisponible($accionesDisponibles, $modulo, "eliminar")) {
                $puedeEliminar = 0;
            }

            if (!accionDisponible($accionesDisponibles, $modulo, "exportar")) {
                $puedeExportar = 0;
            }

            /*
                Perfil siempre visible.
            */
            if ($modulo === "perfil") {
                $puedeVer = 1;
            }

            /*
                Si no puede ver el módulo, no puede hacer acciones internas.
            */
            if ($puedeVer === 0) {
                $puedeCrear = 0;
                $puedeEditar = 0;
                $puedeEliminar = 0;
                $puedeExportar = 0;
            }
        }

        $stmt->bind_param(
            "isiiiii",
            $usuarioId,
            $modulo,
            $puedeVer,
            $puedeCrear,
            $puedeEditar,
            $puedeEliminar,
            $puedeExportar
        );

        if (!$stmt->execute()) {
            throw new Exception("Error al guardar permiso del módulo: " . $modulo);
        }
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Permisos detallados actualizados correctamente"
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