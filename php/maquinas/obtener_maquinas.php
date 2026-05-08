<?php
header('Content-Type: application/json');
require_once __DIR__ . "/../conexion.php";

$sql = "
    SELECT 
        id,
        numero_maquina,
        nombre_maquina,
        zona,
        estado
    FROM maquinas
    ORDER BY numero_maquina ASC
";

$result = $conn->query($sql);

$maquinas = [];

if ($result) {

    while ($row = $result->fetch_assoc()) {
        $maquinas[] = $row;
    }

    echo json_encode([
        "success" => true,
        "data" => $maquinas
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Error al obtener máquinas"
    ]);
}

$conn->close();
?>