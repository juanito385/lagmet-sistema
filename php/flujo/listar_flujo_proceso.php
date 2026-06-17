<?php

/* =========================
   IRONIX - OBTENER FLUJO PROCESO
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("flujo_proceso", "ver");


require_once __DIR__ . "/../conexion.php";

date_default_timezone_set("America/Santiago");

$conn->set_charset("utf8mb4");


/* =========================
   VALIDAR MÉTODO
========================= */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Método no permitido",
        "productos" => []
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


try {

    /*
        Este endpoint obtiene productos con sus máquinas usadas,
        respetando el orden_proceso guardado al registrar producción.

        Reglas:
        - Si una máquina no tiene orden_proceso válido, se ordena después.
        - Luego se normaliza el orden de todas las máquinas.
        - Control de Calidad (CC) siempre se agrega al final.
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
            CASE 
                WHEN pm.orden_proceso IS NULL OR pm.orden_proceso <= 0 THEN 999999
                ELSE pm.orden_proceso
            END ASC,
            pm.id ASC
    ";

    $resultado = $conn->query($sql);

    if (!$resultado) {
        throw new Exception("Error en consulta SQL: " . $conn->error);
    }

    $productos = [];

    while ($fila = $resultado->fetch_assoc()) {

        $idProduccion = intval($fila["produccion_id"]);

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

        $ordenOriginal = $fila["orden_proceso"];

        $productos[$idProduccion]["operaciones"][] = [
            "id" => intval($fila["produccion_maquina_id"]),
            "id_maquina" => intval($fila["id_maquina"]),
            "orden" => ($ordenOriginal !== null && intval($ordenOriginal) > 0)
                ? intval($ordenOriginal)
                : null,
            "zona" => $fila["zona"],
            "maquina" => $fila["maquina"],
            "tipo" => "maquina",
            "horas" => intval($fila["horas"]),
            "minutos" => intval($fila["minutos"])
        ];
    }


    /* =========================
       NORMALIZAR OPERACIONES
    ========================= */

    foreach ($productos as &$producto) {

        $operaciones = $producto["operaciones"];

        usort($operaciones, function ($a, $b) {

            $ordenA = $a["orden"] !== null ? intval($a["orden"]) : 999999;
            $ordenB = $b["orden"] !== null ? intval($b["orden"]) : 999999;

            if ($ordenA !== $ordenB) {
                return $ordenA - $ordenB;
            }

            return intval($a["id"]) - intval($b["id"]);
        });

        $operacionesNormalizadas = [];
        $ordenNormalizado = 1;

        foreach ($operaciones as $operacion) {

            $operacion["orden"] = $ordenNormalizado;
            $operacionesNormalizadas[] = $operacion;

            $ordenNormalizado++;
        }

        /*
            Control de Calidad siempre al final.
        */
        $operacionesNormalizadas[] = [
            "id" => null,
            "id_maquina" => null,
            "orden" => $ordenNormalizado,
            "zona" => "control_calidad",
            "maquina" => "CC",
            "tipo" => "control_calidad",
            "horas" => 0,
            "minutos" => 0
        ];

        $producto["operaciones"] = $operacionesNormalizadas;
    }

    unset($producto);


    /* =========================
       RESPUESTA
    ========================= */

    echo json_encode([
        "success" => true,
        "productos" => array_values($productos)
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {

    if (http_response_code() === 200) {
        http_response_code(500);
    }

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "productos" => []
    ], JSON_UNESCAPED_UNICODE);
}


if (isset($conn) && $conn instanceof mysqli) {
    $conn->close();
}