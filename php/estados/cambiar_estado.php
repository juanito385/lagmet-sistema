<?php

/* =========================
   IRONIX - CAMBIAR ESTADO
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("POST");
ironixRequerirPermiso("estados", "editar");


require_once __DIR__ . "/../conexion.php";
require_once __DIR__ . "/../gantt/version_gantt.php";

date_default_timezone_set("America/Santiago");


/* =========================
   VARIABLES DE CONTROL
========================= */

$transaccionIniciada = false;
$httpCode = 500;


try {

    if (!isset($conn) || !($conn instanceof mysqli)) {
        throw new Exception("No se encontró la conexión a la base de datos.");
    }

    $conn->set_charset("utf8mb4");


    /* =========================
       RECIBIR DATOS
    ========================= */

    $input = json_decode(file_get_contents("php://input"), true);

    if (!is_array($input)) {
        $input = $_POST;
    }

    $produccionId = isset($input["produccion_id"]) ? intval($input["produccion_id"]) : 0;
    $nuevoEstado = isset($input["estado"]) ? trim($input["estado"]) : "";
    $observacion = isset($input["observacion"]) ? trim($input["observacion"]) : "";


    /* =========================
       VALIDACIONES
    ========================= */

    if ($produccionId <= 0) {
        $httpCode = 400;
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
        $httpCode = 400;
        throw new Exception("Estado no permitido.");
    }


    /* =========================
       USUARIO AUTENTICADO
    ========================= */

    /*
        Seguridad Fase 4:
        No se usa usuario_id desde POST ni sesiones antiguas.
        Se usa el usuario autenticado validado por guard.php.
    */

    $usuarioId = intval($IRONIX_USER_ID ?? ($_SESSION["ironix_usuario_id"] ?? 0));

    if ($usuarioId <= 0) {
        $httpCode = 401;
        throw new Exception("Sesión inválida.");
    }

    $usuarioNombre = trim($IRONIX_USER_NAME ?? "") !== ""
        ? trim($IRONIX_USER_NAME)
        : "Usuario IRONIX";


    /* =========================
       INICIAR TRANSACCIÓN
    ========================= */

    $conn->begin_transaction();
    $transaccionIniciada = true;


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

    if (!$stmt) {
        throw new Exception("Error al preparar consulta de producción: " . $conn->error);
    }

    $stmt->bind_param("i", $produccionId);

    if (!$stmt->execute()) {
        throw new Exception("Error al consultar producción: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $produccion = $result->fetch_assoc();

    $stmt->close();

    if (!$produccion) {
        $httpCode = 404;
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

        if (!$stmtUpdate) {
            throw new Exception("Error al preparar actualización con fecha real: " . $conn->error);
        }

        $stmtUpdate->bind_param("si", $nuevoEstado, $produccionId);

    } else {
        $stmtUpdate = $conn->prepare("
            UPDATE produccion
            SET 
                estado_actual = ?,
                fecha_estado_actual = NOW()
            WHERE id = ?
        ");

        if (!$stmtUpdate) {
            throw new Exception("Error al preparar actualización de estado: " . $conn->error);
        }

        $stmtUpdate->bind_param("si", $nuevoEstado, $produccionId);
    }

    if (!$stmtUpdate->execute()) {
        throw new Exception("Error al actualizar estado: " . $stmtUpdate->error);
    }

    $stmtUpdate->close();


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

    if (!$stmtHistorial) {
        throw new Exception("Error al preparar historial de estados: " . $conn->error);
    }

    $stmtHistorial->bind_param(
        "isssis",
        $produccionId,
        $estadoAnterior,
        $nuevoEstado,
        $observacion,
        $usuarioId,
        $usuarioNombre
    );

    if (!$stmtHistorial->execute()) {
        throw new Exception("Error al guardar historial de estado: " . $stmtHistorial->error);
    }

    $stmtHistorial->close();


    /* =========================
       ACTUALIZAR VERSION GANTT
    ========================= */

    actualizarVersionGantt($conn);


    /* =========================
       CONFIRMAR TRANSACCIÓN
    ========================= */

    $conn->commit();
    $transaccionIniciada = false;

    $conn->close();

    ironixResponderJson([
        "success" => true,
        "message" => "Estado actualizado correctamente.",
        "data" => [
            "produccion_id" => $produccionId,
            "estado_anterior" => $estadoAnterior,
            "estado_nuevo" => $nuevoEstado,
            "usuario" => $usuarioNombre
        ]
    ], 200);

} catch (Throwable $e) {

    if ($transaccionIniciada && isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => $e->getMessage()
    ], $httpCode);
}