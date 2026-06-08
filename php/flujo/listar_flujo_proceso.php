<?php

header('Content-Type: application/json');
require_once __DIR__ . "/../conexion.php";

date_default_timezone_set("America/Santiago");

try {
    

    /*
        Este endpoint obtiene productos con sus máquinas usadas,
        respetando el orden_proceso guardado al registrar producción.
    */

    $sql = "
        SELECT
            p.id AS produccion_id,
            p.numero_pedido,
            p.codigo,
            p.producto,
            p.cantidad,
            p.fecha,
            p.fecha_fin,
            p.fecha_fin_real,
            p.estado_actual,

            pm.id AS produccion_maquina_id,
            pm.id_maquina,
            pm.zona,
            pm.maquina,
            pm.uso,
            pm.orden_proceso,
            pm.horas,
            pm.minutos

        FROM produccion p

        INNER JOIN produccion_maquinas pm
            ON pm.produccion_id = p.id

        WHERE pm.uso = 'si'

        ORDER BY
            p.id DESC,
            pm.orden_proceso ASC,
            pm.id ASC
    ";

    $resultado = $conn->query($sql);

    if (!$resultado) {
        throw new Exception("Error en consulta SQL: " . $conn->error);
    }

    $productos = [];

    while ($fila = $resultado->fetch_assoc()) {

        $idProduccion = $fila["produccion_id"];

        if (!isset($productos[$idProduccion])) {

            $productos[$idProduccion] = [
                "id" => intval($fila["produccion_id"]),
                "numero_pedido" => $fila["numero_pedido"],
                "codigo" => $fila["codigo"],
                "producto" => $fila["producto"],
                "cantidad" => intval($fila["cantidad"]),
                "fecha" => $fila["fecha"],
                "fecha_fin" => $fila["fecha_fin"],
                "fecha_fin_real" => $fila["fecha_fin_real"],
                "estado_actual" => $fila["estado_actual"] ?: "pendiente",
                "operaciones" => []
            ];
        }

        $orden = $fila["orden_proceso"];

        $productos[$idProduccion]["operaciones"][] = [
            "id" => intval($fila["produccion_maquina_id"]),
            "id_maquina" => intval($fila["id_maquina"]),
            "orden" => $orden !== null ? intval($orden) : null,
            "zona" => $fila["zona"],
            "maquina" => $fila["maquina"],
            "tipo" => "maquina",
            "horas" => intval($fila["horas"]),
            "minutos" => intval($fila["minutos"])
        ];
    }

    /*
        Agregar CC automáticamente al final de cada flujo.
        CC no viene desde la BD, se suma visualmente como cierre obligatorio.
    */
    foreach ($productos as &$producto) {

        $ultimoOrden = 0;

        foreach ($producto["operaciones"] as $operacion) {
            if ($operacion["orden"] !== null && $operacion["orden"] > $ultimoOrden) {
                $ultimoOrden = $operacion["orden"];
            }
        }

        $producto["operaciones"][] = [
            "id" => null,
            "id_maquina" => null,
            "orden" => $ultimoOrden + 1,
            "zona" => "control_calidad",
            "maquina" => "CC",
            "tipo" => "control_calidad",
            "horas" => 0,
            "minutos" => 0
        ];
    }

    echo json_encode([
        "success" => true,
        "productos" => array_values($productos)
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$conn->close();
?>