<?php
header('Content-Type: application/json');
include("conexion.php");

$sql = "
SELECT m.numero_maquina, m.nombre_maquina,
CASE 
    WHEN EXISTS (
        SELECT 1 FROM produccion_maquinas pm
        WHERE pm.maquina = m.numero_maquina AND pm.uso = 'si'
    ) THEN 'Si'
    ELSE 'No'
END AS estado
FROM maquinas m
";

$result = $conn->query($sql);

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $data
]);

$conn->close();
?>