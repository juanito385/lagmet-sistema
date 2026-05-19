<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../conexion.php";

$sql = "
    SELECT 
        id,
        numero_maquina,
        nombre_maquina,
        zona,
        estado,
        observacion,
        fecha_actualizacion,

        CASE
            WHEN estado = 'Si' THEN 'Operativa'
            WHEN estado = 'No' THEN 'No operativa'
            WHEN estado = 'Mantencion' THEN 'En mantención'
            ELSE 'Sin estado'
        END AS estado_texto,

        CASE
            WHEN estado = 'Si' THEN 0
            ELSE 1
        END AS bloqueada

    FROM maquinas
    ORDER BY numero_maquina ASC
";

$result = $conn->query($sql);

$maquinas = [];

if ($result) {

    while ($row = $result->fetch_assoc()) {
        $maquinas[] = [
            "id" => (int)$row["id"],
            "numero_maquina" => (int)$row["numero_maquina"],
            "nombre_maquina" => $row["nombre_maquina"],
            "zona" => $row["zona"],
            "estado" => $row["estado"],
            "estado_texto" => $row["estado_texto"],
            "bloqueada" => (int)$row["bloqueada"],
            "observacion" => $row["observacion"],
            "fecha_actualizacion" => $row["fecha_actualizacion"]
        ];
    }

    echo json_encode([
        "success" => true,
        "data" => $maquinas
    ], JSON_UNESCAPED_UNICODE);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Error al obtener máquinas",
        "error" => $conn->error
    ], JSON_UNESCAPED_UNICODE);
}

$conn->close();
?>