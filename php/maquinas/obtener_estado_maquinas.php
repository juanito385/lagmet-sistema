<?php

/* =========================
   IRONIX - OBTENER ESTADOS DE MÁQUINAS
========================= */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 3
========================= */

ironixRequerirPermiso("monitoreo", "ver");


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


try {

    /* =========================
       VALIDAR MÉTODO
    ========================= */

    if ($_SERVER["REQUEST_METHOD"] !== "GET") {
        http_response_code(405);

        echo json_encode([
            "success" => false,
            "message" => "Método no permitido",
            "data" => []
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }


    /* =========================
       RECIBIR FILTROS
    ========================= */

    $buscar = trim($_GET["buscar"] ?? "");
    $estado = trim($_GET["estado"] ?? "todos");
    $zona   = trim($_GET["zona"] ?? "todas");

    $pagina = isset($_GET["pagina"]) ? intval($_GET["pagina"]) : 1;
    $limite = isset($_GET["limite"]) ? intval($_GET["limite"]) : 5;

    $estadosPermitidos = ["todos", "Si", "No", "Mantencion"];

    if (!in_array($estado, $estadosPermitidos, true)) {
        $estado = "todos";
    }

    if ($pagina < 1) {
        $pagina = 1;
    }

    if ($limite < 1) {
        $limite = 5;
    }

    /*
        Protección simple:
        Evita pedir miles de registros en una sola petición.
    */
    if ($limite > 100) {
        $limite = 100;
    }

    if (mb_strlen($buscar, "UTF-8") > 100) {
        $buscar = mb_substr($buscar, 0, 100, "UTF-8");
    }

    if (mb_strlen($zona, "UTF-8") > 50) {
        $zona = mb_substr($zona, 0, 50, "UTF-8");
    }

    $offset = ($pagina - 1) * $limite;


    /* =========================
       CONSTRUIR WHERE
    ========================= */

    $where = [];
    $params = [];
    $types = "";

    if ($buscar !== "") {
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

    $sqlTotal = "
        SELECT COUNT(*) AS total 
        FROM maquinas 
        $whereSql
    ";

    $stmtTotal = $conn->prepare($sqlTotal);

    if (!$stmtTotal) {
        throw new Exception("Error al preparar total filtrado: " . $conn->error);
    }

    if (count($params) > 0) {
        $stmtTotal->bind_param($types, ...$params);
    }

    if (!$stmtTotal->execute()) {
        throw new Exception("Error al ejecutar total filtrado: " . $stmtTotal->error);
    }

    $totalResultado = $stmtTotal->get_result()->fetch_assoc();
    $totalFiltrado = intval($totalResultado["total"] ?? 0);

    $stmtTotal->close();


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

    if (!$stmt) {
        throw new Exception("Error al preparar consulta de máquinas: " . $conn->error);
    }

    $paramsDatos = $params;
    $typesDatos = $types . "ii";

    $paramsDatos[] = $limite;
    $paramsDatos[] = $offset;

    $stmt->bind_param($typesDatos, ...$paramsDatos);

    if (!$stmt->execute()) {
        throw new Exception("Error al ejecutar consulta de máquinas: " . $stmt->error);
    }

    $resultado = $stmt->get_result();

    $maquinas = [];

    while ($row = $resultado->fetch_assoc()) {
        $maquinas[] = [
            "id" => intval($row["id"]),
            "numero_maquina" => intval($row["numero_maquina"]),
            "nombre_maquina" => $row["nombre_maquina"],
            "zona" => $row["zona"],
            "estado" => $row["estado"],
            "observacion" => $row["observacion"],
            "actualizado_por" => $row["actualizado_por"],
            "fecha_actualizacion" => $row["fecha_actualizacion"]
        ];
    }

    $stmt->close();


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

    if (!$resumenResult) {
        throw new Exception("Error al obtener resumen de máquinas: " . $conn->error);
    }

    $resumen = $resumenResult->fetch_assoc();

    $totalGeneral = intval($resumen["total"] ?? 0);
    $operativas = intval($resumen["operativas"] ?? 0);
    $noOperativas = intval($resumen["no_operativas"] ?? 0);
    $mantencion = intval($resumen["mantencion"] ?? 0);


    /* =========================
       RESPUESTA
    ========================= */

    echo json_encode([
        "success" => true,
        "data" => $maquinas,
        "paginacion" => [
            "pagina" => $pagina,
            "limite" => $limite,
            "total_filtrado" => $totalFiltrado,
            "total_paginas" => $limite > 0 ? intval(ceil($totalFiltrado / $limite)) : 0
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

} catch (Throwable $e) {

    if (http_response_code() === 200) {
        http_response_code(500);
    }

    echo json_encode([
        "success" => false,
        "message" => "Error al obtener estados de máquinas",
        "error" => $e->getMessage(),
        "data" => []
    ], JSON_UNESCAPED_UNICODE);
}


if (isset($conn) && $conn instanceof mysqli) {
    $conn->close();
}