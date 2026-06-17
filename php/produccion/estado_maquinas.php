<?php

/* =========================
   IRONIX - ESTADO USO DE MÁQUINAS
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
   CONSULTAR ESTADO DE USO
========================= */

$sql = "
    SELECT 
        m.id,
        m.numero_maquina,
        m.nombre_maquina,
        m.zona,
        m.estado AS estado_maquina,

        CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM produccion_maquinas pm
                WHERE pm.id_maquina = m.id
                AND pm.uso = 'si'
            ) 
            THEN 'Si'
            ELSE 'No'
        END AS estado

    FROM maquinas m
    ORDER BY m.numero_maquina ASC
";

$result = $conn->query($sql);

if (!$result) {
    $error = $conn->error;
    $conn->close();

    ironixResponderJson([
        "success" => false,
        "message" => "Error al obtener estado de máquinas",
        "error" => $error,
        "data" => []
    ], 500);
}

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = [
        "id" => intval($row["id"]),
        "numero_maquina" => intval($row["numero_maquina"]),
        "nombre_maquina" => $row["nombre_maquina"],
        "zona" => $row["zona"],
        "estado_maquina" => $row["estado_maquina"],
        "estado" => $row["estado"]
    ];
}


/* =========================
   RESPUESTA
========================= */

$conn->close();

ironixResponderJson([
    "success" => true,
    "data" => $data
], 200);