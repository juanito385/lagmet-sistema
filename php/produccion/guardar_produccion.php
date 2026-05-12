<?php
header('Content-Type: application/json');
require_once __DIR__ . "/../conexion.php";

date_default_timezone_set("America/Santiago");

/* =========================
   TURNO AUTOMÁTICO
========================= */
function calcularTurnoAutomatico() {
    $horaActual = date("H:i");

    if ($horaActual >= "07:30" && $horaActual <= "12:59") {
        return "Mañana";
    }

    if ($horaActual >= "13:00" && $horaActual <= "16:45") {
        return "Tarde";
    }

    return "Noche";
}

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


$situacion_descripcion = trim($input["situacion_descripcion"] ?? "");

$fallo_maquina = trim($input["fallo_maquina"] ?? "no");
$maquina_fallo = trim($input["maquina_fallo"] ?? "");

if ($fallo_maquina === "no") {
    $maquina_fallo = "";
}

/* TURNO */
$turno = calcularTurnoAutomatico();

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
            fallo_maquina,
            maquina_fallo,
            usuario_id,
            turno
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmt) {
        throw new Exception("Error al preparar inserción en produccion: " . $conn->error);
    }

    $stmt->bind_param(
        "sssissiissssssis",
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
        $fallo_maquina,
        $maquina_fallo,
        $usuario_id,
        $turno
    );

    if (!$stmt->execute()) {
        throw new Exception("Error al insertar producción: " . $stmt->error);
    }

    $produccion_id = $conn->insert_id;

    if ($produccion_id <= 0) {
        throw new Exception("No se pudo obtener el ID de la producción creada");
    }

    $stmt->close();


    /* GUARDAR MAQUINAS */
    $stmtMaquina = $conn->prepare("
        INSERT INTO produccion_maquinas
        (produccion_id, id_maquina, zona, maquina, uso, horas, minutos)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmtMaquina) {
        throw new Exception("Error al preparar inserción en produccion_maquinas: " . $conn->error);
    }

    foreach ($maquinas as $m) {
        $id_maquina = intval($m["id_maquina"] ?? 0);
        $zona = trim($m["zona"] ?? "");
        $maquina = trim($m["maquina"] ?? "");
        $uso = trim($m["uso"] ?? "no");
        $horas = intval($m["horas"] ?? 0);
        $minutos = intval($m["minutos"] ?? 0);

        if ($id_maquina <= 0 || $zona === "" || $maquina === "") {
            continue;
        }

        $stmtMaquina->bind_param(
            "iisssii",
            $produccion_id,
            $id_maquina,
            $zona,
            $maquina,
            $uso,
            $horas,
            $minutos
        );

        if (!$stmtMaquina->execute()) {
            throw new Exception("Error al insertar máquina de producción: " . $stmtMaquina->error);
        }
    }

    $stmtMaquina->close();

    /* GUARDAR SITUACION */
    if ($tiempo_muerto > 0 && $situacion_descripcion !== "") {
        $stmtSituacion = $conn->prepare("
            INSERT INTO situaciones_produccion
            (
                produccion_id,
                tiempo_extra_minutos,
                descripcion
            )
            VALUES (?, ?, ?)
        ");

        if (!$stmtSituacion) {
            throw new Exception("Error al preparar inserción en situaciones_produccion: " . $conn->error);
        }

        $stmtSituacion->bind_param(
            "iis",
            $produccion_id,
            $tiempo_muerto,
            $situacion_descripcion
        );

        $stmtSituacion->execute();
        $stmtSituacion->close();
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Producción guardada correctamente",
        "turno" => $turno
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