<?php
header("Content-Type: application/json; charset=utf-8");

date_default_timezone_set("America/Santiago");

require_once "../conexion.php";

try {
    $sql = "
        SELECT 
            modulo,
            version,
            actualizado_en
        FROM sistema_versiones
        WHERE modulo = 'gantt_maquinas'
        LIMIT 1
    ";

    $resultado = $conn->query($sql);

    if (!$resultado) {
        throw new Exception("Error al consultar versión del Gantt.");
    }

    if ($resultado->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "No existe versión registrada para gantt_maquinas."
        ]);
        exit;
    }

    $fila = $resultado->fetch_assoc();

    echo json_encode([
        "success" => true,
        "modulo" => $fila["modulo"],
        "version" => (int)$fila["version"],
        "actualizado_en" => $fila["actualizado_en"]
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}