<?php
header('Content-Type: application/json');
include("conexion.php");

$email = $_POST['email'] ?? '';
$codigo = $_POST['codigo'] ?? '';

if(!$email || !$codigo){
    echo json_encode(["success"=>false]);
    exit;
}

$result = $conn->query("
SELECT * FROM usuarios 
WHERE correo='$email' 
AND codigo_recuperacion='$codigo'
AND codigo_expira > NOW()
");

if($result && $result->num_rows > 0){
    echo json_encode(["success"=>true]);
}else{
    echo json_encode(["success"=>false]);
}
?>