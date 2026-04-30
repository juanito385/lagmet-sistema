<?php
header('Content-Type: application/json');
require_once __DIR__ . "/conexion.php";

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if(!$email || !$password){
    echo json_encode(["success"=>false]);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$conn->query("
UPDATE usuarios 
SET password='$hash',
codigo_recuperacion=NULL,
codigo_expira=NULL
WHERE correo='$email'
");

echo json_encode(["success"=>true]);
?>