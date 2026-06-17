<?php

/* =========================
   IRONIX - OBTENER MÁQUINAS
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("GET");
ironixRequerirPermiso("monitoreo", "ver");


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


/* =========================
   CONSULTAR MÁQUINAS
========================= */

$sql = "
    SELECT 
        id,
        numero_maquina,
        nombre_maquina,
        zona,
        estado,
        observacion,
        fecha_actualizacion,

        CASE
            WHEN estado = 'Si' THEN 'Operativa'
            WHEN estado = 'No' THEN 'No operativa'
            WHEN estado = 'Mantencion' THEN 'En mantención'
            ELSE 'Sin estado'
        END AS estado_texto,

        CASE
            WHEN estado = 'Si' THEN 0
            ELSE 1
        END AS bloqueada

    FROM maquinas
    ORDER BY numero_maquina ASC
";

$result = $conn->query($sql);

$maquinas = [];

if ($result) {

    while ($row = $result->fetch_assoc()) {
        $maquinas[] = [
            "id" => intval($row["id"]),
            "numero_maquina" => intval($row["numero_maquina"]),
            "nombre_maquina" => $row["nombre_maquina"],
            "zona" => $row["zona"],
            "estado" => $row["estado"],
            "estado_texto" => $row["estado_texto"],
            "bloqueada" => intval($row["bloqueada"]),
            "observacion" => $row["observacion"],
            "fecha_actualizacion" => $row["fecha_actualizacion"]
        ];
    }

    $conn->close();

    ironixResponderJson([
        "success" => true,
        "data" => $maquinas
    ], 200);

} else {

    $error = $conn->error;
    $conn->close();

    ironixResponderJson([
        "success" => false,
        "message" => "Error al obtener máquinas",
        "error" => $error,
        "data" => []
    ], 500);
}