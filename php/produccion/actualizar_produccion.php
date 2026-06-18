<?php

/* =========================
   IRONIX - ACTUALIZAR PRODUCCIÓN
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 5
========================= */

ironixRequerirMetodo("POST");

/*
    Fase 5:
    Este endpoint actualiza un registro existente de producción/producto.

    Puede ser usado desde:
    - Productos, al presionar editar.
    - Monitoreo, porque el formulario de edición se carga en esa sección.
    - Producción, como capa lógica del backend.

    Para actualizar un registro existente, el usuario debe tener permiso
    de edición/guardado en alguna de esas secciones.
*/

if (
    !ironixTienePermiso("productos", "editar") &&
    !ironixTienePermiso("monitoreo", "editar") &&
    !ironixTienePermiso("produccion", "editar") &&
    !ironixTienePermiso("produccion", "guardar")
) {
    ironixResponderSinPermisos("No tienes permisos para actualizar producción");
}

require_once __DIR__ . "/../conexion.php";
require_once __DIR__ . "/../gantt/version_gantt.php";


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

$id = intval($input["id"] ?? 0);

if ($id <= 0) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "ID inválido"
    ]);

    exit;
}


/* =========================
   VALIDAR QUE EXISTE
========================= */

$check = $conn->prepare("
    SELECT id 
    FROM produccion 
    WHERE id = ?
");

if (!$check) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error al validar producción: " . $conn->error
    ]);

    exit;
}

$check->bind_param("i", $id);
$check->execute();

$resultCheck = $check->get_result();

if ($resultCheck->num_rows === 0) {
    $check->close();

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "No existe una producción con el ID indicado"
    ]);

    exit;
}

$check->close();


/* =========================
   NORMALIZAR DATOS
========================= */

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
   ACTUALIZAR PRODUCCIÓN
========================= */

$conn->begin_transaction();

try {

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
            fallo_maquina = ?,
            maquina_fallo = ?,
            usuario_id = ?
        WHERE id = ?
    ");

    if (!$stmt) {
        throw new Exception("Error en UPDATE: " . $conn->error);
    }

    $stmt->bind_param(
        "sssissiissssssii",
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
        $id
    );

    if (!$stmt->execute()) {
        throw new Exception("Error al actualizar: " . $stmt->error);
    }

    $stmt->close();


    /* =========================
       ELIMINAR MÁQUINAS ANTIGUAS
    ========================= */

    $delete = $conn->prepare("
        DELETE FROM produccion_maquinas 
        WHERE produccion_id = ?
    ");

    if (!$delete) {
        throw new Exception("Error al preparar eliminación de máquinas: " . $conn->error);
    }

    $delete->bind_param("i", $id);

    if (!$delete->execute()) {
        throw new Exception("Error al eliminar máquinas anteriores: " . $delete->error);
    }

    $delete->close();


    /* =========================
       INSERTAR MÁQUINAS NUEVAS
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
        throw new Exception("Error en INSERT maquinas: " . $conn->error);
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
            $id,
            $id_maquina,
            $zona,
            $maquina,
            $uso,
            $orden_proceso,
            $horas,
            $minutos
        );

        if (!$stmtMaquina->execute()) {
            throw new Exception("Error al insertar máquina: " . $stmtMaquina->error);
        }
    }

    $stmtMaquina->close();


    /* =========================
       ACTUALIZAR SITUACIÓN
    ========================= */

    $deleteSituacion = $conn->prepare("
        DELETE FROM situaciones_produccion 
        WHERE produccion_id = ?
    ");

    if (!$deleteSituacion) {
        throw new Exception("Error al preparar eliminación de situación: " . $conn->error);
    }

    $deleteSituacion->bind_param("i", $id);

    if (!$deleteSituacion->execute()) {
        throw new Exception("Error al eliminar situación anterior: " . $deleteSituacion->error);
    }

    $deleteSituacion->close();

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
            throw new Exception("Error en INSERT situacion: " . $conn->error);
        }

        $stmtSituacion->bind_param(
            "iis",
            $id,
            $tiempo_muerto,
            $situacion_descripcion
        );

        if (!$stmtSituacion->execute()) {
            throw new Exception("Error al insertar situación: " . $stmtSituacion->error);
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
        "message" => "Registro actualizado correctamente"
    ]);

} catch (Exception $e) {

    $conn->rollback();

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();