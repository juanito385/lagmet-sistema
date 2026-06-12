<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../conexion.php";

$email = trim($_POST['email'] ?? '');
$codigo = trim($_POST['codigo'] ?? '');

if ($email === '' || $codigo === '') {
    echo json_encode([
        "success" => false,
        "message" => "Correo y código son obligatorios"
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Correo inválido"
    ]);
    exit;
}

/*
    Ahora NO buscamos por codigo_recuperacion = ?
    porque en la base de datos está guardado como hash.
*/
$stmt = $conn->prepare("
    SELECT id, codigo_recuperacion, codigo_expira
    FROM usuarios
    WHERE correo = ?
    LIMIT 1
");

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Error interno al preparar la consulta"
    ]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if (!$result || $result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Correo no encontrado"
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

$usuario = $result->fetch_assoc();

$codigoHashGuardado = $usuario["codigo_recuperacion"] ?? "";
$codigoExpira = $usuario["codigo_expira"] ?? null;

if ($codigoHashGuardado === "" || $codigoExpira === null) {
    echo json_encode([
        "success" => false,
        "message" => "No existe un código activo"
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

if (strtotime($codigoExpira) <= time()) {
    echo json_encode([
        "success" => false,
        "message" => "El código expiró"
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

/*
    Comparación segura:
    código ingresado por el usuario VS hash guardado en la BD.
*/
if (!password_verify($codigo, $codigoHashGuardado)) {
    echo json_encode([
        "success" => false,
        "message" => "Código incorrecto"
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Código verificado correctamente"
]);

$stmt->close();
$conn->close();

?>