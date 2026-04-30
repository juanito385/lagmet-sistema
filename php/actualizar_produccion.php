<?php
header('Content-Type: application/json');
require_once __DIR__ . "/conexion.php";

// Leer JSON
$input = json_decode(file_get_contents("php://input"), true);

$id = intval($input["id"] ?? 0);

if ($id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "ID inválido"
    ]);
    exit;
}

// Datos principales
$numero_pedido = trim($input["numero_pedido"] ?? "");
$codigo = trim($input["codigo"] ?? "");
$producto = trim($input["producto"] ?? "");
$cantidad = intval($input["cantidad"] ?? 0);
$fecha = trim($input["fecha"] ?? "");
$fecha_fin = trim($input["fecha_fin"] ?? "");
$trabaja_sabado = trim($input["trabaja_sabado"] ?? "no");
$tiempo_muerto = intval($input["tiempo_muerto"] ?? 0);
$dias = intval($input["dias"] ?? 0);
$grupo = trim($input["grupo"] ?? "");
$almuerzo = trim($input["almuerzo"] ?? "no");
$salida = trim($input["salida"] ?? "--");
$usuario_id = isset($input["usuario_id"]) ? intval($input["usuario_id"]) : null;

$maquinas = $input["maquinas"] ?? [];

// Validación básica
if ($numero_pedido === "" || $codigo === "" || $producto === "" || $cantidad <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Faltan datos obligatorios"
    ]);
    exit;
}

// Transacción
$conn->begin_transaction();

try {

    /* =========================
       ACTUALIZAR PRODUCCION
    ========================= */
    $stmt = $conn->prepare("
    UPDATE produccion SET
            numero_pedido = ?,
            codigo = ?,
            producto = ?,
            cantidad = ?,
            fecha = ?,
            fecha_fin = ?,
            tiempo_muerto = ?,
            dias = ?,
            grupo = ?,
            almuerzo = ?,
            trabaja_sabado = ?,
            salida = ?,
            usuario_id = ?
        WHERE id = ?
    ");

    if (!$stmt) {
        throw new Exception("Error en UPDATE: " . $conn->error);
    }

        $stmt->bind_param(
        "sssissiissssii",
        $numero_pedido,
        $codigo,
        $producto,
        $cantidad,
        $fecha,
        $fecha_fin,
        $tiempo_muerto,
        $dias,
        $grupo,
        $almuerzo,
        $trabaja_sabado,
        $salida,
        $usuario_id,
        $id
    );

    if (!$stmt->execute()) {
        throw new Exception("Error al actualizar: " . $stmt->error);
    }

    $stmt->close();

    /* =========================
       ELIMINAR MAQUINAS ANTIGUAS
    ========================= */
    $delete = $conn->prepare("DELETE FROM produccion_maquinas WHERE produccion_id = ?");
    $delete->bind_param("i", $id);
    $delete->execute();
    $delete->close();

    /* =========================
       INSERTAR MAQUINAS NUEVAS
    ========================= */
    $stmtMaquina = $conn->prepare("
        INSERT INTO produccion_maquinas
        (produccion_id, zona, maquina, uso, horas, minutos)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    if (!$stmtMaquina) {
        throw new Exception("Error en INSERT maquinas: " . $conn->error);
    }

    foreach ($maquinas as $m) {
        $zona = trim($m["zona"] ?? "");
        $maquina = trim($m["maquina"] ?? "");
        $uso = trim($m["uso"] ?? "no");
        $horas = intval($m["horas"] ?? 0);
        $minutos = intval($m["minutos"] ?? 0);

        if ($zona === "" || $maquina === "") continue;

        $stmtMaquina->bind_param(
            "isssii",
            $id,
            $zona,
            $maquina,
            $uso,
            $horas,
            $minutos
        );

        if (!$stmtMaquina->execute()) {
            throw new Exception("Error al insertar máquina: " . $stmtMaquina->error);
        }
    }

    $stmtMaquina->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Registro actualizado correctamente"
    ]);

} catch (Exception $e) {

    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>