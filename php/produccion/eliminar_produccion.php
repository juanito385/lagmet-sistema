<?php
header('Content-Type: application/json');

require_once __DIR__ . "/../conexion.php";
require_once __DIR__ . "/../gantt/version_gantt.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$id = intval($input["id"] ?? 0);

if ($id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID inválido"
    ]);
    exit;
}

$conn->begin_transaction();

try {

    /* =========================
       VALIDAR QUE EXISTE
    ========================= */
    $check = $conn->prepare("SELECT id FROM produccion WHERE id = ?");

    if (!$check) {
        throw new Exception("Error al preparar validación: " . $conn->error);
    }

    $check->bind_param("i", $id);
    $check->execute();

    $resultCheck = $check->get_result();

    if ($resultCheck->num_rows === 0) {
        $check->close();

        throw new Exception("No existe una producción con el ID indicado");
    }

    $check->close();


    /* =========================
       ELIMINAR SITUACIONES ASOCIADAS
    ========================= */
    $deleteSituaciones = $conn->prepare("
        DELETE FROM situaciones_produccion
        WHERE produccion_id = ?
    ");

    if (!$deleteSituaciones) {
        throw new Exception("Error al preparar eliminación de situaciones: " . $conn->error);
    }

    $deleteSituaciones->bind_param("i", $id);

    if (!$deleteSituaciones->execute()) {
        throw new Exception("Error al eliminar situaciones: " . $deleteSituaciones->error);
    }

    $deleteSituaciones->close();


    /* =========================
       ELIMINAR MÁQUINAS ASOCIADAS
    ========================= */
    $deleteMaquinas = $conn->prepare("
        DELETE FROM produccion_maquinas
        WHERE produccion_id = ?
    ");

    if (!$deleteMaquinas) {
        throw new Exception("Error al preparar eliminación de máquinas: " . $conn->error);
    }

    $deleteMaquinas->bind_param("i", $id);

    if (!$deleteMaquinas->execute()) {
        throw new Exception("Error al eliminar máquinas asociadas: " . $deleteMaquinas->error);
    }

    $deleteMaquinas->close();


    /* =========================
       ELIMINAR PRODUCCIÓN
    ========================= */
    $stmt = $conn->prepare("
        DELETE FROM produccion
        WHERE id = ?
    ");

    if (!$stmt) {
        throw new Exception("Error al preparar eliminación de producción: " . $conn->error);
    }

    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
        throw new Exception("Error al eliminar producción: " . $stmt->error);
    }

    if ($stmt->affected_rows <= 0) {
        throw new Exception("No se eliminó ningún registro de producción");
    }

    $stmt->close();


    /* =========================
       ACTUALIZAR VERSION GANTT
    ========================= */
    actualizarVersionGantt($conn);


    /* =========================
       CONFIRMAR TRANSACCIÓN
    ========================= */
    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Registro eliminado correctamente"
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => "Error al eliminar: " . $e->getMessage()
    ]);
}

$conn->close();
?>