<?php
header('Content-Type: application/json');
include("conexion.php");

$email = $_POST['email'] ?? '';

if(!$email){
    echo json_encode(["success"=>false]);
    exit;
}

$result = $conn->query("SELECT * FROM usuarios WHERE correo='$email'");

if($result && $result->num_rows > 0){

    $codigo = rand(100000,999999);
    $expira = date("Y-m-d H:i:s", strtotime("+10 minutes"));

    $conn->query("UPDATE usuarios 
    SET codigo_recuperacion='$codigo', codigo_expira='$expira' 
    WHERE correo='$email'");

    echo json_encode([
        "success"=>true
    ]);

}else{
    echo json_encode([
        "success"=>false
    ]);
}
?>