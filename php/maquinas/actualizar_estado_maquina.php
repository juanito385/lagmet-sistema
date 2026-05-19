<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../conexion.php";

try {

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        echo json_encode([
            "success" => false,
            "message" => "Método no permitido"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $rawData = file_get_contents("php://input");
    $data = json_decode($rawData, true);

    if (!is_array($data)) {
        $data = $_POST;
    }

    $id = isset($data["id"]) ? (int)$data["id"] : 0;
    $estado = trim($data["estado"] ?? "");
    $observacion = trim($data["observacion"] ?? "");
    $actualizadoPor = trim($data["actualizado_por"] ?? "Admin");

    $estadosPermitidos = ["Si", "No", "Mantencion"];

    if ($id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "ID de máquina inválido"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!in_array($estado, $estadosPermitidos, true)) {
        echo json_encode([
            "success" => false,
            "message" => "Estado de máquina inválido"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($actualizadoPor === "") {
        $actualizadoPor = "Admin";
    }

    if ($observacion === "") {
        $observacion = null;
    }

    $sql = "
        UPDATE maquinas
        SET 
            estado = ?,
            observacion = ?,
            actualizado_por = ?,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ?
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Error al preparar la consulta",
            "error" => $conn->error
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt->bind_param(
        "sssi",
        $estado,
        $observacion,
        $actualizadoPor,
        $id
    );

    $stmt->execute();

    if ($stmt->affected_rows < 0) {
        echo json_encode([
            "success" => false,
            "message" => "No se pudo actualizar la máquina"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Estado de máquina actualizado correctamente"
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar estado de máquina",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);

}