<?php

/* =========================
   IRONIX - ACTUALIZAR ESTADO DE MÁQUINA
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("POST");
ironixRequerirPermiso("maquinas", "actualizar_estado");


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


try {

    /* =========================
       RECIBIR DATOS
    ========================= */

    $rawData = file_get_contents("php://input");
    $data = json_decode($rawData, true);

    if (!is_array($data)) {
        $data = $_POST;
    }

    $id = isset($data["id"]) ? intval($data["id"]) : 0;
    $estado = trim($data["estado"] ?? "");
    $observacion = trim($data["observacion"] ?? "");

    /*
        Seguridad Fase 4:
        No se recibe actualizado_por desde frontend.
        Se usa el usuario autenticado por guard.php.
    */
    $actualizadoPor = trim($IRONIX_USER_NAME ?? "") !== ""
        ? trim($IRONIX_USER_NAME)
        : "Usuario IRONIX";

    $estadosPermitidos = ["Si", "No", "Mantencion"];


    /* =========================
       VALIDACIONES
    ========================= */

    if ($id <= 0) {
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "ID de máquina inválido"
        ], 400);
    }

    if (!in_array($estado, $estadosPermitidos, true)) {
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "Estado de máquina inválido"
        ], 400);
    }

    if ($observacion === "") {
        $observacion = null;
    }


    /* =========================
       VALIDAR QUE EXISTE LA MÁQUINA
    ========================= */

    $sqlCheck = "
        SELECT 
            id,
            numero_maquina,
            nombre_maquina,
            zona,
            estado
        FROM maquinas
        WHERE id = ?
        LIMIT 1
    ";

    $stmtCheck = $conn->prepare($sqlCheck);

    if (!$stmtCheck) {
        throw new Exception("Error al preparar validación de máquina: " . $conn->error);
    }

    $stmtCheck->bind_param("i", $id);

    if (!$stmtCheck->execute()) {
        throw new Exception("Error al validar máquina: " . $stmtCheck->error);
    }

    $resultCheck = $stmtCheck->get_result();

    if (!$resultCheck || $resultCheck->num_rows === 0) {
        $stmtCheck->close();
        $conn->close();

        ironixResponderJson([
            "success" => false,
            "message" => "Máquina no encontrada"
        ], 404);
    }

    $maquinaActual = $resultCheck->fetch_assoc();
    $stmtCheck->close();


    /* =========================
       ACTUALIZAR ESTADO
    ========================= */

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
        throw new Exception("Error al preparar actualización: " . $conn->error);
    }

    $stmt->bind_param(
        "sssi",
        $estado,
        $observacion,
        $actualizadoPor,
        $id
    );

    if (!$stmt->execute()) {
        throw new Exception("Error al actualizar estado de máquina: " . $stmt->error);
    }

    $stmt->close();


    /* =========================
       RESPUESTA
    ========================= */

    $conn->close();

    ironixResponderJson([
        "success" => true,
        "message" => "Estado de máquina actualizado correctamente",
        "maquina" => [
            "id" => intval($maquinaActual["id"]),
            "numero_maquina" => intval($maquinaActual["numero_maquina"]),
            "nombre_maquina" => $maquinaActual["nombre_maquina"],
            "zona" => $maquinaActual["zona"],
            "estado_anterior" => $maquinaActual["estado"],
            "estado_nuevo" => $estado,
            "observacion" => $observacion,
            "actualizado_por" => $actualizadoPor
        ]
    ], 200);

} catch (Throwable $e) {

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => "Error al actualizar estado de máquina",
        "error" => $e->getMessage()
    ], 500);
}