<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../conexion.php";

try {

    $buscar = $_GET["buscar"] ?? "";
    $estado = $_GET["estado"] ?? "todos";
    $zona   = $_GET["zona"] ?? "todas";

    $pagina = isset($_GET["pagina"]) ? (int)$_GET["pagina"] : 1;
    $limite = isset($_GET["limite"]) ? (int)$_GET["limite"] : 5;

    if ($pagina < 1) {
        $pagina = 1;
    }

    if ($limite < 1) {
        $limite = 5;
    }

    $offset = ($pagina - 1) * $limite;

    $where = [];
    $params = [];
    $types = "";

    if (!empty($buscar)) {
        $where[] = "nombre_maquina LIKE ?";
        $params[] = "%" . $buscar . "%";
        $types .= "s";
    }

    if ($estado !== "todos") {
        $where[] = "estado = ?";
        $params[] = $estado;
        $types .= "s";
    }

    if ($zona !== "todas") {
        $where[] = "zona = ?";
        $params[] = $zona;
        $types .= "s";
    }

    $whereSql = "";

    if (count($where) > 0) {
        $whereSql = "WHERE " . implode(" AND ", $where);
    }

    /* =========================
       TOTAL FILTRADO
    ========================= */
    $sqlTotal = "SELECT COUNT(*) AS total FROM maquinas $whereSql";
    $stmtTotal = $conn->prepare($sqlTotal);

    if (count($params) > 0) {
        $stmtTotal->bind_param($types, ...$params);
    }

    $stmtTotal->execute();
    $totalResultado = $stmtTotal->get_result()->fetch_assoc();
    $totalFiltrado = (int)$totalResultado["total"];

    /* =========================
       DATOS PAGINADOS
    ========================= */
    $sql = "
        SELECT 
            id,
            numero_maquina,
            nombre_maquina,
            zona,
            estado,
            observacion,
            actualizado_por,
            fecha_actualizacion
        FROM maquinas
        $whereSql
        ORDER BY numero_maquina ASC
        LIMIT ? OFFSET ?
    ";

    $stmt = $conn->prepare($sql);

    $paramsDatos = $params;
    $typesDatos = $types . "ii";
    $paramsDatos[] = $limite;
    $paramsDatos[] = $offset;

    $stmt->bind_param($typesDatos, ...$paramsDatos);
    $stmt->execute();

    $resultado = $stmt->get_result();

    $maquinas = [];

    while ($row = $resultado->fetch_assoc()) {
        $maquinas[] = [
            "id" => (int)$row["id"],
            "numero_maquina" => (int)$row["numero_maquina"],
            "nombre_maquina" => $row["nombre_maquina"],
            "zona" => $row["zona"],
            "estado" => $row["estado"],
            "observacion" => $row["observacion"],
            "actualizado_por" => $row["actualizado_por"],
            "fecha_actualizacion" => $row["fecha_actualizacion"]
        ];
    }

    /* =========================
       RESUMEN GENERAL
    ========================= */
    $sqlResumen = "
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN estado = 'Si' THEN 1 ELSE 0 END) AS operativas,
            SUM(CASE WHEN estado = 'No' THEN 1 ELSE 0 END) AS no_operativas,
            SUM(CASE WHEN estado = 'Mantencion' THEN 1 ELSE 0 END) AS mantencion
        FROM maquinas
    ";

    $resumenResult = $conn->query($sqlResumen);
    $resumen = $resumenResult->fetch_assoc();

    $totalGeneral = (int)$resumen["total"];
    $operativas = (int)$resumen["operativas"];
    $noOperativas = (int)$resumen["no_operativas"];
    $mantencion = (int)$resumen["mantencion"];

    echo json_encode([
        "success" => true,
        "data" => $maquinas,
        "paginacion" => [
            "pagina" => $pagina,
            "limite" => $limite,
            "total_filtrado" => $totalFiltrado,
            "total_paginas" => ceil($totalFiltrado / $limite)
        ],
        "resumen" => [
            "total" => $totalGeneral,
            "operativas" => $operativas,
            "no_operativas" => $noOperativas,
            "mantencion" => $mantencion,
            "porcentaje_operativas" => $totalGeneral > 0 ? round(($operativas / $totalGeneral) * 100) : 0,
            "porcentaje_no_operativas" => $totalGeneral > 0 ? round(($noOperativas / $totalGeneral) * 100) : 0,
            "porcentaje_mantencion" => $totalGeneral > 0 ? round(($mantencion / $totalGeneral) * 100) : 0
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => "Error al obtener estados de máquinas",
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);

}