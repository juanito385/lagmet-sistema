<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../conexion.php";

date_default_timezone_set('America/Santiago');

$response = [
    "success" => false,
    "message" => "",
    "data" => []
];

try {

    if (!isset($conn)) {
        throw new Exception("No se encontró la conexión a la base de datos.");
    }

    $conn->set_charset("utf8mb4");

    $produccionId = isset($_GET["produccion_id"]) ? intval($_GET["produccion_id"]) : 0;

    if ($produccionId <= 0) {
        throw new Exception("ID de producción inválido.");
    }

    $stmt = $conn->prepare("
        SELECT 
            id,
            produccion_id,
            estado_anterior,
            estado_nuevo,
            observacion,
            usuario_id,
            usuario_nombre,
            fecha_cambio
        FROM historial_estados
        WHERE produccion_id = ?
        ORDER BY fecha_cambio DESC
    ");

    $stmt->bind_param("i", $produccionId);
    $stmt->execute();

    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $response["data"][] = [
            "id" => intval($row["id"]),
            "produccion_id" => intval($row["produccion_id"]),
            "estado_anterior" => $row["estado_anterior"],
            "estado_nuevo" => $row["estado_nuevo"],
            "observacion" => $row["observacion"],
            "usuario_id" => $row["usuario_id"],
            "usuario_nombre" => $row["usuario_nombre"] ?: "Admin",
            "fecha_cambio" => $row["fecha_cambio"]
        ];
    }

    $response["success"] = true;
    $response["message"] = "Historial obtenido correctamente.";

} catch (Throwable $e) {

    $response = [
        "success" => false,
        "message" => $e->getMessage(),
        "data" => []
    ];
}

echo json_encode($response);
?>