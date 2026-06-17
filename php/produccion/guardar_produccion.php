<?php

/* =========================
   IRONIX - GUARDAR PRODUCCIÓN
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("produccion", "guardar");


require_once __DIR__ . "/../conexion.php";
require_once __DIR__ . "/../gantt/version_gantt.php";

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


/* =========================
   VALIDAR MÉTODO
========================= */

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ]);

    exit;
}


/* =========================
   RECIBIR DATOS
========================= */

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "JSON inválido"
    ]);

    exit;
}

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

/*
    Seguridad Fase 3:
    El usuario_id NO debe venir desde el frontend.
    Se usa el usuario autenticado desde la sesión PHP.
*/
$usuario_id = intval($IRONIX_USER_ID);

$maquinas = $input["maquinas"] ?? [];

$situacion_descripcion = trim($input["situacion_descripcion"] ?? "");

$fallo_maquina = trim($input["fallo_maquina"] ?? "no");
$maquina_fallo = trim($input["maquina_fallo"] ?? "");

if ($fallo_maquina === "no") {
    $maquina_fallo = "";
}


/* =========================
   TURNO
========================= */

$turno = calcularTurnoAutomatico();


/* =========================
   VALIDACIONES
========================= */

if ($numero_pedido === "" || $codigo === "" || $producto === "" || $cantidad <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Faltan datos obligatorios"
    ]);

    exit;
}

if (!is_array($maquinas)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Formato de máquinas inválido"
    ]);

    exit;
}


/* =========================
   GUARDAR PRODUCCIÓN
========================= */

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


    /* =========================
       GUARDAR MÁQUINAS
    ========================= */

    $stmtMaquina = $conn->prepare("
        INSERT INTO produccion_maquinas
        (
            produccion_id, 
            id_maquina, 
            zona, 
            maquina, 
            uso, 
            orden_proceso, 
            horas, 
            minutos
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    if (!$stmtMaquina) {
        throw new Exception("Error al preparar inserción en produccion_maquinas: " . $conn->error);
    }

    foreach ($maquinas as $m) {
        $id_maquina = intval($m["id_maquina"] ?? 0);
        $zona = trim($m["zona"] ?? "");
        $maquina = trim($m["maquina"] ?? "");
        $uso = trim($m["uso"] ?? "no");

        $orden_proceso = null;

        if (
            $uso === "si" &&
            isset($m["orden_proceso"]) &&
            $m["orden_proceso"] !== null &&
            $m["orden_proceso"] !== ""
        ) {
            $orden_proceso = intval($m["orden_proceso"]);
        }

        $horas = intval($m["horas"] ?? 0);
        $minutos = intval($m["minutos"] ?? 0);

        if ($id_maquina <= 0 || $zona === "" || $maquina === "") {
            continue;
        }

        $stmtMaquina->bind_param(
            "iisssiii",
            $produccion_id,
            $id_maquina,
            $zona,
            $maquina,
            $uso,
            $orden_proceso,
            $horas,
            $minutos
        );

        if (!$stmtMaquina->execute()) {
            throw new Exception("Error al insertar máquina de producción: " . $stmtMaquina->error);
        }
    }

    $stmtMaquina->close();


    /* =========================
       GUARDAR SITUACIÓN
    ========================= */

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

        if (!$stmtSituacion->execute()) {
            throw new Exception("Error al guardar situación de producción: " . $stmtSituacion->error);
        }

        $stmtSituacion->close();
    }


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
        "message" => "Producción guardada correctamente",
        "turno" => $turno
    ]);

} catch (Exception $e) {

    $conn->rollback();

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al guardar: " . $e->getMessage()
    ]);
}

$conn->close();