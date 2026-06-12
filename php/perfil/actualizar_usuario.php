<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . "/../conexion.php";

/* =========================
   RECIBIR DATOS BASE
========================= */

$id = isset($_POST["usuario_id"]) ? intval($_POST["usuario_id"]) : 0;
$nombre = isset($_POST["nombre"]) ? trim($_POST["nombre"]) : "";
$correo = isset($_POST["correo"]) ? trim($_POST["correo"]) : "";

if ($id <= 0) {
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

/* =========================
   CAMPOS OPCIONALES PERFIL
========================= */

$tieneTelefono = array_key_exists("telefono", $_POST);
$tieneArea = array_key_exists("area", $_POST);
$tieneIdioma = array_key_exists("idioma", $_POST);
$tieneEstado = array_key_exists("estado", $_POST);

$telefono = $tieneTelefono ? trim($_POST["telefono"]) : null;
$area = $tieneArea ? trim($_POST["area"]) : null;
$idioma = $tieneIdioma ? trim($_POST["idioma"]) : null;
$estado = $tieneEstado ? trim($_POST["estado"]) : null;

/*
    Validaciones simples de campos opcionales.
    Si no vienen desde el frontend, no se tocan.
*/
if ($tieneArea && $area === "") {
    echo json_encode([
        "success" => false,
        "message" => "El área no puede quedar vacía"
    ]);
    exit;
}

if ($tieneIdioma && $idioma === "") {
    echo json_encode([
        "success" => false,
        "message" => "El idioma no puede quedar vacío"
    ]);
    exit;
}

if ($tieneEstado && !in_array($estado, ["activa", "inactiva", "bloqueada"])) {
    echo json_encode([
        "success" => false,
        "message" => "Estado de cuenta no válido"
    ]);
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
    exit;
}

$stmtCorreo->bind_param("si", $correo, $id);
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
   CONSTRUIR UPDATE DINÁMICO
========================= */

$campos = [
    "nombre = ?",
    "correo = ?"
];

$tipos = "ss";
$valores = [$nombre, $correo];

if ($tieneTelefono) {
    $campos[] = "telefono = ?";
    $tipos .= "s";
    $valores[] = $telefono;
}

if ($tieneArea) {
    $campos[] = "area = ?";
    $tipos .= "s";
    $valores[] = $area;
}

if ($tieneIdioma) {
    $campos[] = "idioma = ?";
    $tipos .= "s";
    $valores[] = $idioma;
}

if ($tieneEstado) {
    $campos[] = "estado = ?";
    $tipos .= "s";
    $valores[] = $estado;
}

$tipos .= "i";
$valores[] = $id;

$sql = "
    UPDATE usuarios 
    SET " . implode(", ", $campos) . "
    WHERE id = ?
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Error al preparar actualización"
    ]);
    exit;
}

$stmt->bind_param($tipos, ...$valores);

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar usuario"
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$stmt->close();

/* =========================
   DEVOLVER USUARIO ACTUALIZADO
========================= */

$sqlUsuario = "
    SELECT 
        id,
        nombre,
        correo,
        rol,
        telefono,
        area,
        idioma,
        estado,
        fecha_creacion
    FROM usuarios
    WHERE id = ?
    LIMIT 1
";

$stmtUsuario = $conn->prepare($sqlUsuario);

if (!$stmtUsuario) {
    echo json_encode([
        "success" => true,
        "message" => "Datos actualizados correctamente"
    ]);
    $conn->close();
    exit;
}

$stmtUsuario->bind_param("i", $id);
$stmtUsuario->execute();

$resultUsuario = $stmtUsuario->get_result();
$usuario = $resultUsuario ? $resultUsuario->fetch_assoc() : null;

echo json_encode([
    "success" => true,
    "message" => "Datos actualizados correctamente",
    "usuario" => $usuario
]);

$stmtUsuario->close();
$conn->close();
?>