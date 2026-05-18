<?php
header('Content-Type: application/json; charset=utf-8');

session_start();

require_once __DIR__ . "/../conexion.php";

date_default_timezone_set('America/Santiago');

$response = [
    "success" => false,
    "message" => ""
];

try {

    if (!isset($conn)) {
        throw new Exception("No se encontró la conexión a la base de datos.");
    }

    $conn->set_charset("utf8mb4");

    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input) {
        $input = $_POST;
    }

    $produccionId = isset($input["produccion_id"]) ? intval($input["produccion_id"]) : 0;
    $nuevoEstado = isset($input["estado"]) ? trim($input["estado"]) : "";
    $observacion = isset($input["observacion"]) ? trim($input["observacion"]) : "";

    if ($produccionId <= 0) {
        throw new Exception("ID de producción inválido.");
    }

    $estadosPermitidos = [
        "pendiente",
        "en_proceso",
        "pausado",
        "terminado",
        "entregado"
    ];

    if (!in_array($nuevoEstado, $estadosPermitidos, true)) {
        throw new Exception("Estado no permitido.");
    }

    $usuarioId = isset($_SESSION["usuario_id"]) ? intval($_SESSION["usuario_id"]) : null;
    $usuarioNombre = $_SESSION["usuario_nombre"] 
        ?? $_SESSION["nombre"] 
        ?? "Admin";

    $conn->begin_transaction();

    /* =========================
       OBTENER PRODUCCIÓN ACTUAL
    ========================= */
    $stmt = $conn->prepare("
        SELECT 
            id,
            estado_actual,
            fecha_fin_real
        FROM produccion
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->bind_param("i", $produccionId);
    $stmt->execute();

    $result = $stmt->get_result();
    $produccion = $result->fetch_assoc();

    if (!$produccion) {
        throw new Exception("No se encontró la producción.");
    }

    $estadoAnterior = $produccion["estado_actual"] ?: "pendiente";

    /* =========================
       ACTUALIZAR PRODUCCIÓN
    ========================= */
    if (
        ($nuevoEstado === "terminado" || $nuevoEstado === "entregado") &&
        empty($produccion["fecha_fin_real"])
    ) {
        $stmtUpdate = $conn->prepare("
            UPDATE produccion
            SET 
                estado_actual = ?,
                fecha_estado_actual = NOW(),
                fecha_fin_real = NOW()
            WHERE id = ?
        ");

        $stmtUpdate->bind_param("si", $nuevoEstado, $produccionId);

    } else {
        $stmtUpdate = $conn->prepare("
            UPDATE produccion
            SET 
                estado_actual = ?,
                fecha_estado_actual = NOW()
            WHERE id = ?
        ");

        $stmtUpdate->bind_param("si", $nuevoEstado, $produccionId);
    }

    $stmtUpdate->execute();

    /* =========================
       INSERTAR HISTORIAL
    ========================= */
    $stmtHistorial = $conn->prepare("
        INSERT INTO historial_estados (
            produccion_id,
            estado_anterior,
            estado_nuevo,
            observacion,
            usuario_id,
            usuario_nombre,
            fecha_cambio
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");

    $stmtHistorial->bind_param(
        "isssis",
        $produccionId,
        $estadoAnterior,
        $nuevoEstado,
        $observacion,
        $usuarioId,
        $usuarioNombre
    );

    $stmtHistorial->execute();

    $conn->commit();

    $response = [
        "success" => true,
        "message" => "Estado actualizado correctamente.",
        "data" => [
            "produccion_id" => $produccionId,
            "estado_anterior" => $estadoAnterior,
            "estado_nuevo" => $nuevoEstado,
            "usuario" => $usuarioNombre
        ]
    ];

} catch (Throwable $e) {

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }

    $response = [
        "success" => false,
        "message" => $e->getMessage()
    ];
}

echo json_encode($response);
?>