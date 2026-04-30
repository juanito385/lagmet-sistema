<?php
header('Content-Type: application/json');
require_once __DIR__ . "/conexion.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

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
$usuario_id = isset($input["usuario_id"]) && $input["usuario_id"] !== null ? intval($input["usuario_id"]) : null;
$maquinas = $input["maquinas"] ?? [];

if ($numero_pedido === "" || $codigo === "" || $producto === "" || $cantidad <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Faltan datos obligatorios"
    ]);
    exit;
}

$conn->begin_transaction();

try {
    $stmt = $conn->prepare("
        INSERT INTO produccion
        (
            numero_pedido, 
            codigo, 
            producto, 
            cantidad, 
            fecha, 
            fecha_fin,
            tiempo_muerto, 
            dias, 
            grupo, 
            almuerzo, 
            trabaja_sabado,
            salida, 
            usuario_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        throw new Exception("Error al preparar inserción en produccion: " . $conn->error);
    }

    $stmt->bind_param(
        "sssissiissssi",
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
        $usuario_id
    );

    $stmt->execute();
    $produccion_id = $conn->insert_id;
    $stmt->close();

    $stmtMaquina = $conn->prepare("
        INSERT INTO produccion_maquinas
        (produccion_id, zona, maquina, uso, horas, minutos)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    if (!$stmtMaquina) {
        throw new Exception("Error al preparar inserción en produccion_maquinas: " . $conn->error);
    }

    foreach ($maquinas as $m) {
        $zona = trim($m["zona"] ?? "");
        $maquina = trim($m["maquina"] ?? "");
        $uso = trim($m["uso"] ?? "no");
        $horas = intval($m["horas"] ?? 0);
        $minutos = intval($m["minutos"] ?? 0);

        $stmtMaquina->bind_param(
            "isssii",
            $produccion_id,
            $zona,
            $maquina,
            $uso,
            $horas,
            $minutos
        );

        $stmtMaquina->execute();
    }

    $stmtMaquina->close();
    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Producción guardada correctamente"
    ]);

} catch (Exception $e) {
    $conn->rollback();

    echo json_encode([
        "success" => false,
        "message" => "Error al guardar: " . $e->getMessage()
    ]);
}

$conn->close();
?>