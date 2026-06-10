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

$input = json_decode(file_get_contents("php://input"), true);

$email = isset($input["email"]) ? trim($input["email"]) : "";
$password = isset($input["password"]) ? trim($input["password"]) : "";

if ($email === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "Completa todos los campos"
    ]);
    exit;
}

/* ===============================
   BUSCAR USUARIO
================================ */
$stmt = $conn->prepare("
    SELECT 
        id, 
        nombre, 
        correo, 
        password, 
        rol
    FROM usuarios
    WHERE correo = ?
    LIMIT 1
");

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Error interno al preparar el login"
    ]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado"
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$user = $result->fetch_assoc();

/* ===============================
   VALIDAR CONTRASEÑA ENCRIPTADA
================================ */
if (!password_verify($password, $user["password"])) {
    echo json_encode([
        "success" => false,
        "message" => "Contraseña incorrecta"
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

/* ===============================
   LOGIN CORRECTO
================================ */
echo json_encode([
    "success" => true,
    "user" => [
        "id" => $user["id"],
        "nombre" => $user["nombre"],
        "email" => $user["correo"],
        "rol" => $user["rol"]
    ]
]);

$stmt->close();
$conn->close();
?>