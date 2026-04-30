<?php
header('Content-Type: application/json');
include("conexion.php");

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

$stmt = $conn->prepare("SELECT id, nombre, correo, password FROM usuarios WHERE correo = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado"
    ]);
    exit;
}

$user = $result->fetch_assoc();

/* LOGIN CON CONTRASEÑA ENCRIPTADA */
if (password_verify($password, $user["password"])) {
    echo json_encode([
        "success" => true,
        "user" => [
            "id" => $user["id"],
            "nombre" => $user["nombre"],
            "email" => $user["correo"]
        ]
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Contraseña incorrecta"
    ]);
}

$stmt->close();
$conn->close();
?>