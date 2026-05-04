<?php
header('Content-Type: application/json');
require_once __DIR__ . "/conexion.php";

$hoy = date("Y-m-d");
$ayer = date("Y-m-d", strtotime("-1 day"));
$inicioMes = date("Y-m-01");

$periodo = $_GET["periodo"] ?? "hoy";

$wherePeriodo = "fecha = '$hoy'";

if ($periodo === "semana") {
    $wherePeriodo = "fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)";
}

if ($periodo === "mes") {
    $wherePeriodo = "fecha >= '$inicioMes'";
}

$response = [
    "success" => true
];

/* TOTAL PRODUCTOS */
$sql = "SELECT COUNT(*) AS total FROM produccion";
$res = $conn->query($sql);
$totalProductos = ($res && $row = $res->fetch_assoc()) ? intval($row["total"]) : 0;

/* PRODUCTOS EN PROCESO */
$sql = "SELECT COUNT(*) AS total 
        FROM produccion 
        WHERE fecha_fin IS NULL OR fecha_fin = ''";
$res = $conn->query($sql);
$productosProceso = ($res && $row = $res->fetch_assoc()) ? intval($row["total"]) : 0;

/* PRODUCCIÓN HOY */
$sql = "SELECT SUM(cantidad) AS total 
        FROM produccion 
        WHERE fecha = '$hoy'";
$res = $conn->query($sql);
$produccionHoy = ($res && $row = $res->fetch_assoc()) ? intval($row["total"] ?? 0) : 0;

/* =========================
   PRODUCCIÓN POR TURNO (REAL)
========================= */
$sql = "SELECT 
            turno,
            SUM(cantidad) AS total
        FROM produccion
        WHERE $wherePeriodo
        GROUP BY turno";

$res = $conn->query($sql);

$turnos = [
    "Mañana" => 0,
    "Tarde" => 0,
    "Noche" => 0
];

if ($res) {
    while ($row = $res->fetch_assoc()) {
        $turno = $row["turno"];
        $turnos[$turno] = intval($row["total"]);
    }
}

/* PRODUCCIÓN AYER */
$sql = "SELECT SUM(cantidad) AS total 
        FROM produccion 
        WHERE fecha = '$ayer'";
$res = $conn->query($sql);
$produccionAyer = ($res && $row = $res->fetch_assoc()) ? intval($row["total"] ?? 0) : 0;

/* =========================
   PRODUCCIÓN ÚLTIMOS 7 DÍAS
========================= */
$sql = "SELECT 
            DATE(fecha) as dia,
            SUM(cantidad) as total
        FROM produccion
        WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY dia
        ORDER BY dia ASC";

$res = $conn->query($sql);

$semana = [];

if ($res) {
    while ($row = $res->fetch_assoc()) {
        $semana[] = [
            "fecha" => $row["dia"],
            "total" => intval($row["total"])
        ];
    }
}

/* PRODUCTOS ESTE MES */
$sql = "SELECT COUNT(*) AS total 
        FROM produccion 
        WHERE fecha >= '$inicioMes'";
$res = $conn->query($sql);
$totalMes = ($res && $row = $res->fetch_assoc()) ? intval($row["total"] ?? 0) : 0;

/* FALLAS */
$sql = "SELECT maquina_fallo, COUNT(*) AS total
        FROM produccion
        WHERE fallo_maquina = 'si'
        AND maquina_fallo IS NOT NULL
        AND maquina_fallo != ''
        GROUP BY maquina_fallo
        ORDER BY total DESC
        LIMIT 3";
$res = $conn->query($sql);

$fallas = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $fallas[] = [
            "maquina" => $row["maquina_fallo"],
            "total" => intval($row["total"])
        ];
    }
}

/* TOP MÁQUINAS */
$sql = "SELECT maquina, COUNT(*) AS usos
        FROM produccion_maquinas
        WHERE uso = 'si'
        GROUP BY maquina
        ORDER BY usos DESC
        LIMIT 3";
$res = $conn->query($sql);

$topMaquinas = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $topMaquinas[] = [
            "maquina" => $row["maquina"],
            "total" => intval($row["usos"])
        ];
    }
}

/* HORAS TRABAJADAS */
$sql = "SELECT 
            SUM(pm.horas) AS horas,
            SUM(pm.minutos) AS minutos
        FROM produccion_maquinas pm
        INNER JOIN produccion p ON pm.produccion_id = p.id
        WHERE pm.uso = 'si'
        AND p.fecha = '$hoy'";
$res = $conn->query($sql);

$horasTrabajadas = 0;
$minutosTrabajados = 0;

if ($res && $row = $res->fetch_assoc()) {
    $horasTrabajadas = intval($row["horas"] ?? 0);
    $minutosTrabajados = intval($row["minutos"] ?? 0);

    $horasTrabajadas += floor($minutosTrabajados / 60);
    $minutosTrabajados = $minutosTrabajados % 60;
}

/* MÁQUINAS DESDE BD */
$sql = "SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN estado = 'Si' THEN 1 ELSE 0 END) AS operativas,
            SUM(CASE WHEN estado = 'No' THEN 1 ELSE 0 END) AS detenidas
        FROM maquinas";

$res = $conn->query($sql);

$totalMaquinas = 0;
$maquinasOperativas = 0;
$maquinasDetenidas = 0;

if ($res && $row = $res->fetch_assoc()) {
    $totalMaquinas = intval($row["total"] ?? 0);
    $maquinasOperativas = intval($row["operativas"] ?? 0);
    $maquinasDetenidas = intval($row["detenidas"] ?? 0);
}

/* ESTADO PRODUCCIÓN */
$sql = "SELECT 
            SUM(CASE WHEN fecha_fin IS NOT NULL THEN 1 ELSE 0 END) AS completados,
            SUM(CASE WHEN fecha_fin IS NULL THEN 1 ELSE 0 END) AS en_proceso,
            SUM(CASE WHEN fecha_fin < '$hoy' AND fecha_fin IS NOT NULL THEN 1 ELSE 0 END) AS atrasados
        FROM produccion";
$res = $conn->query($sql);

$completados = 0;
$enProceso = 0;
$atrasados = 0;

if ($res && $row = $res->fetch_assoc()) {
    $completados = intval($row["completados"] ?? 0);
    $enProceso = intval($row["en_proceso"] ?? 0);
    $atrasados = intval($row["atrasados"] ?? 0);
}

/* ÚLTIMOS REGISTROS */
$sql = "SELECT 
            id,
            producto,
            numero_pedido,
            codigo,
            cantidad,
            fecha
        FROM produccion
        ORDER BY id DESC
        LIMIT 5";
$res = $conn->query($sql);

$ultimos = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $ultimos[] = $row;
    }
}

/* EFICIENCIA */
$metaDiaria = 100;
$eficiencia = $metaDiaria > 0 ? round(($produccionHoy / $metaDiaria) * 100) : 0;

/* RESPUESTA FINAL */
$response["cards"] = [
    "total_productos" => $totalProductos,
    "productos_proceso" => $productosProceso,
    "maquinas_operativas" => $maquinasOperativas,
    "maquinas_detenidas" => $maquinasDetenidas,
    "horas_trabajadas" => $horasTrabajadas . "h " . str_pad($minutosTrabajados, 2, "0", STR_PAD_LEFT) . "m",
    "eficiencia" => $eficiencia,
    "total_mes" => $totalMes
];

$response["turnos"] = [
    "manana" => $turnos["Mañana"],
    "tarde" => $turnos["Tarde"],
    "noche" => $turnos["Noche"],
    "total_hoy" => array_sum($turnos),
    "meta" => $eficiencia
];

$response["comparacion"] = [
    "hoy" => $produccionHoy,
    "ayer" => $produccionAyer
];

$response["semana"] = $semana;

$response["resumen"] = [
    "operativas" => $maquinasOperativas,
    "en_proceso" => $productosProceso,
    "detenidas" => $maquinasDetenidas,
    "total" => $totalMaquinas
];

$response["fallas"] = $fallas;
$response["top_maquinas"] = $topMaquinas;

$response["top_usuarios"] = [
    [
        "usuario" => "Admin",
        "total" => $produccionHoy
    ]
];

$response["estado_produccion"] = [
    "completados" => $completados,
    "en_proceso" => $enProceso,
    "atrasados" => $atrasados
];

$response["ultimos_registros"] = $ultimos;

echo json_encode($response);
$conn->close();
?>