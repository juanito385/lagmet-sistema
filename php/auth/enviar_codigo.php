<?php
header('Content-Type: application/json');
require_once __DIR__ . "/../conexion.php";

$email = trim($_POST['email'] ?? '');

if ($email === '') {
    echo json_encode(["success" => false]);
    exit;
}

$stmt = $conn->prepare("SELECT id FROM usuarios WHERE correo = ?");

if (!$stmt) {
    echo json_encode(["success" => false]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result && $result->num_rows > 0) {

    $codigo = rand(100000, 999999);
    $expira = date("Y-m-d H:i:s", strtotime("+10 minutes"));

    $stmtUpdate = $conn->prepare("
        UPDATE usuarios 
        SET codigo_recuperacion = ?, codigo_expira = ?
        WHERE correo = ?
    ");

    if (!$stmtUpdate) {
        echo json_encode(["success" => false]);
        exit;
    }

    $stmtUpdate->bind_param("sss", $codigo, $expira, $email);
    $stmtUpdate->execute();

    echo json_encode(["success" => true]);

    $stmtUpdate->close();

} else {
    echo json_encode(["success" => false]);
}

$stmt->close();
$conn->close();
?>