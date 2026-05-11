<?php
header('Content-Type: application/json');
require_once __DIR__ . "/../conexion.php";

$hoy = date("Y-m-d");
$ayer = date("Y-m-d", strtotime("-1 day"));
$inicioMes = date("Y-m-01");

$periodo = $_GET["periodo"] ?? "hoy";
$fechaFiltro = $_GET["fecha"] ?? "";

$fechaConsulta = $hoy;

if ($periodo === "fecha" && preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaFiltro)) {
    $fechaConsulta = $fechaFiltro;
}

$wherePeriodo = "fecha = '$hoy'";

if ($periodo === "ayer") {
    $wherePeriodo = "fecha = '$ayer'";
}

if ($periodo === "semana") {
    $wherePeriodo = "fecha >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)";
}

if ($periodo === "mes") {
    $wherePeriodo = "fecha >= '$inicioMes'";
}

if ($periodo === "fecha") {
    $wherePeriodo = "fecha = '$fechaConsulta'";
}

$response = [
    "success" => true
];

function formatearMinutos(int $minutos): string {
    $horas = floor($minutos / 60);
    $mins = $minutos % 60;

    return $horas . "h " . str_pad($mins, 2, "0", STR_PAD_LEFT) . "m";
}

/* TOTAL PRODUCTOS GENERAL */
$sql = "SELECT COUNT(*) AS total FROM produccion";
$res = $conn->query($sql);
$totalProductosGeneral = ($res && $row = $res->fetch_assoc()) ? intval($row["total"]) : 0;

/* TOTAL PRODUCTOS SEGÚN FILTRO */
$totalProductos = $totalProductosGeneral;
$totalProductosTexto = "Registrados en el sistema";
$totalProductosDetalle = "Total general: " . $totalProductosGeneral;

if ($periodo === "ayer") {
    $sql = "SELECT COUNT(*) AS total FROM produccion WHERE $wherePeriodo";
    $res = $conn->query($sql);
    $totalProductos = ($res && $row = $res->fetch_assoc()) ? intval($row["total"]) : 0;

    $totalProductosTexto = "Registrados ayer";
    $totalProductosDetalle = "Total general: " . $totalProductosGeneral;
}

if ($periodo === "semana") {
    $sql = "SELECT COUNT(*) AS total FROM produccion WHERE $wherePeriodo";
    $res = $conn->query($sql);
    $totalProductos = ($res && $row = $res->fetch_assoc()) ? intval($row["total"]) : 0;

    $totalProductosTexto = "Registrados esta semana";
    $totalProductosDetalle = "Total general: " . $totalProductosGeneral;
}

if ($periodo === "mes") {
    $sql = "SELECT COUNT(*) AS total FROM produccion WHERE $wherePeriodo";
    $res = $conn->query($sql);
    $totalProductos = ($res && $row = $res->fetch_assoc()) ? intval($row["total"]) : 0;

    $totalProductosTexto = "Registrados este mes";
    $totalProductosDetalle = "Total general: " . $totalProductosGeneral;
}

if ($periodo === "fecha") {
    $sql = "SELECT COUNT(*) AS total FROM produccion WHERE $wherePeriodo";
    $res = $conn->query($sql);
    $totalProductos = ($res && $row = $res->fetch_assoc()) ? intval($row["total"]) : 0;

    $totalProductosTexto = "Registrados en la fecha seleccionada";
    $totalProductosDetalle = "Total general: " . $totalProductosGeneral;
}

/* =========================
   PRODUCTOS EN PROCESO
   En proceso = fecha_fin no vencida
========================= */

$fechaReferencia = $hoy;

if ($periodo === "ayer") {
    $fechaReferencia = $ayer;
}

if ($periodo === "fecha") {
    $fechaReferencia = $fechaConsulta;
}

$productosProcesoTexto = "Producción activa actualmente";
$productosProcesoDetalle = "Según fecha estimada de término";

/* Hoy: activos actualmente, sin limitar por fecha de ingreso */
$sql = "SELECT COUNT(*) AS total 
        FROM produccion
        WHERE fecha_fin IS NOT NULL
        AND fecha_fin != ''
        AND fecha_fin >= '$fechaReferencia'";

if ($periodo === "ayer") {
    $productosProcesoTexto = "En proceso según ayer";
    $productosProcesoDetalle = "Con fecha de término igual o posterior a ayer";

    $sql = "SELECT COUNT(*) AS total 
            FROM produccion
            WHERE $wherePeriodo
            AND fecha_fin IS NOT NULL
            AND fecha_fin != ''
            AND fecha_fin >= '$fechaReferencia'";
}

if ($periodo === "semana") {
    $productosProcesoTexto = "En proceso esta semana";
    $productosProcesoDetalle = "Registrados esta semana y aún vigentes";

    $sql = "SELECT COUNT(*) AS total 
            FROM produccion
            WHERE $wherePeriodo
            AND fecha_fin IS NOT NULL
            AND fecha_fin != ''
            AND fecha_fin >= CURDATE()";
}

if ($periodo === "mes") {
    $productosProcesoTexto = "En proceso este mes";
    $productosProcesoDetalle = "Registrados este mes y aún vigentes";

    $sql = "SELECT COUNT(*) AS total 
            FROM produccion
            WHERE $wherePeriodo
            AND fecha_fin IS NOT NULL
            AND fecha_fin != ''
            AND fecha_fin >= CURDATE()";
}

if ($periodo === "fecha") {
    $productosProcesoTexto = "En proceso para la fecha seleccionada";
    $productosProcesoDetalle = "Con fecha de término igual o posterior a " . date("d/m/Y", strtotime($fechaConsulta));

    $sql = "SELECT COUNT(*) AS total 
            FROM produccion
            WHERE fecha <= '$fechaConsulta'
            AND fecha_fin IS NOT NULL
            AND fecha_fin != ''
            AND fecha_fin >= '$fechaConsulta'";
}

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
   GRÁFICO PRODUCCIÓN SEGÚN FILTRO
========================= */

$graficoProduccionTitulo = "Producción de hoy";

if ($periodo === "ayer") {
    $graficoProduccionTitulo = "Producción de ayer";
}

if ($periodo === "semana") {
    $graficoProduccionTitulo = "Producción últimos 7 días";
}

if ($periodo === "mes") {
    $graficoProduccionTitulo = "Producción del mes";
}

if ($periodo === "fecha") {
    $graficoProduccionTitulo = "Producción del " . date("d/m/Y", strtotime($fechaConsulta));
}

/* HOY / AYER / FECHA: gráfico por turnos */
if ($periodo === "hoy" || $periodo === "ayer" || $periodo === "fecha") {

    $sql = "SELECT 
                turno AS etiqueta,
                SUM(cantidad) AS total
            FROM produccion
            WHERE $wherePeriodo
            GROUP BY turno
            ORDER BY 
                CASE 
                    WHEN turno = 'Mañana' THEN 1
                    WHEN turno = 'Tarde' THEN 2
                    WHEN turno = 'Noche' THEN 3
                    ELSE 4
                END";

    $res = $conn->query($sql);

    $semana = [];

    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $semana[] = [
                "fecha" => $row["etiqueta"],
                "total" => intval($row["total"] ?? 0),
                "tipo" => "turno"
            ];
        }
    }

    if (empty($semana)) {
        $semana = [
            ["fecha" => "Mañana", "total" => 0, "tipo" => "turno"],
            ["fecha" => "Tarde", "total" => 0, "tipo" => "turno"],
            ["fecha" => "Noche", "total" => 0, "tipo" => "turno"]
        ];
    }
}

/* SEMANA: últimos 7 días */
if ($periodo === "semana") {

    $sql = "SELECT 
                DATE(fecha) AS dia,
                SUM(cantidad) AS total
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
                "total" => intval($row["total"] ?? 0),
                "tipo" => "fecha"
            ];
        }
    }
}

/* MES: producción por día del mes */
if ($periodo === "mes") {

    $sql = "SELECT 
                DATE(fecha) AS dia,
                SUM(cantidad) AS total
            FROM produccion
            WHERE fecha >= '$inicioMes'
            GROUP BY dia
            ORDER BY dia ASC";

    $res = $conn->query($sql);

    $semana = [];

    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $semana[] = [
                "fecha" => $row["dia"],
                "total" => intval($row["total"] ?? 0),
                "tipo" => "fecha"
            ];
        }
    }
}

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
        AND p.$wherePeriodo";
$res = $conn->query($sql);

$horasTrabajadas = 0;
$minutosTrabajados = 0;

if ($res && $row = $res->fetch_assoc()) {
    $horasTrabajadas = intval($row["horas"] ?? 0);
    $minutosTrabajados = intval($row["minutos"] ?? 0);

    $horasTrabajadas += floor($minutosTrabajados / 60);
    $minutosTrabajados = $minutosTrabajados % 60;
}

$horasTrabajadasTexto = "Tiempo trabajado hoy";
$horasTrabajadasDetalle = "Según máquinas utilizadas";

if ($periodo === "ayer") {
    $horasTrabajadasTexto = "Tiempo trabajado ayer";
    $horasTrabajadasDetalle = "Según registros de ayer";
}

if ($periodo === "semana") {
    $horasTrabajadasTexto = "Tiempo trabajado esta semana";
    $horasTrabajadasDetalle = "Acumulado últimos 7 días";
}

if ($periodo === "mes") {
    $horasTrabajadasTexto = "Tiempo trabajado este mes";
    $horasTrabajadasDetalle = "Acumulado mensual";
}

if ($periodo === "fecha") {
    $horasTrabajadasTexto = "Tiempo trabajado en la fecha seleccionada";
    $horasTrabajadasDetalle = "Fecha: " . date("d/m/Y", strtotime($fechaConsulta));
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

$porcentajeOperativas = $totalMaquinas > 0 
    ? round(($maquinasOperativas / $totalMaquinas) * 100) 
    : 0;

$porcentajeDetenidas = $totalMaquinas > 0 
    ? round(($maquinasDetenidas / $totalMaquinas) * 100) 
    : 0;

/* LISTA MÁQUINAS OPERATIVAS */
$sql = "SELECT 
            id,
            numero_maquina,
            nombre_maquina,
            zona,
            estado,
            observacion,
            fecha_actualizacion
        FROM maquinas
        WHERE estado = 'Si'
        ORDER BY zona ASC, numero_maquina ASC";

$res = $conn->query($sql);

$listaMaquinasOperativas = [];

if ($res) {
    while ($row = $res->fetch_assoc()) {
        $listaMaquinasOperativas[] = $row;
    }
}

/* LISTA MÁQUINAS DETENIDAS */
$sql = "SELECT 
            id,
            numero_maquina,
            nombre_maquina,
            zona,
            estado,
            observacion,
            fecha_actualizacion
        FROM maquinas
        WHERE estado = 'No'
        ORDER BY zona ASC, numero_maquina ASC";

$res = $conn->query($sql);

$listaMaquinasDetenidas = [];

if ($res) {
    while ($row = $res->fetch_assoc()) {
        $listaMaquinasDetenidas[] = $row;
    }
}

/* TIEMPO DETENIDAS */
$sql = "SELECT 
            SUM(TIMESTAMPDIFF(MINUTE, fecha_actualizacion, NOW())) AS total_minutos
        FROM maquinas
        WHERE estado = 'No'";

$res = $conn->query($sql);

$totalMinutosDetenidas = 0;

if ($res && $row = $res->fetch_assoc()) {
    $totalMinutosDetenidas = intval($row["total_minutos"] ?? 0);
}

$promedioMinutosDetenidas = $maquinasDetenidas > 0 
    ? round($totalMinutosDetenidas / $maquinasDetenidas) 
    : 0;

/* ESTADO PRODUCCIÓN TEMPORAL */
$fechaReferenciaEstado = $hoy;

if ($periodo === "ayer") {
    $fechaReferenciaEstado = $ayer;
}

if ($periodo === "fecha") {
    $fechaReferenciaEstado = $fechaConsulta;
}

/* En proceso: productos activos en la fecha de referencia */
$sql = "SELECT COUNT(*) AS total
        FROM produccion
        WHERE fecha <= '$fechaReferenciaEstado'
        AND fecha_fin IS NOT NULL
        AND fecha_fin != ''
        AND fecha_fin >= '$fechaReferenciaEstado'";
$res = $conn->query($sql);
$enProceso = ($res && $row = $res->fetch_assoc()) ? intval($row["total"] ?? 0) : 0;

/* Atrasados: productos cuya fecha fin ya venció */
$sql = "SELECT COUNT(*) AS total
        FROM produccion
        WHERE fecha_fin IS NOT NULL
        AND fecha_fin != ''
        AND fecha_fin < '$fechaReferenciaEstado'";
$res = $conn->query($sql);
$atrasados = ($res && $row = $res->fetch_assoc()) ? intval($row["total"] ?? 0) : 0;

/* Completados temporal: total general - en proceso - atrasados */
$completados = max(0, $totalProductosGeneral - $enProceso - $atrasados);

/* ÚLTIMOS REGISTROS */
$sql = "SELECT 
            p.id,
            p.producto,
            p.numero_pedido,
            p.codigo,
            p.cantidad,
            p.fecha,
            p.turno,
            COALESCE(u.nombre, 'Admin') AS usuario,
            COALESCE(
                GROUP_CONCAT(
                    CASE 
                        WHEN pm.uso = 'si' THEN pm.maquina 
                    END 
                    SEPARATOR ', '
                ),
                'Sin máquina'
            ) AS maquinas_usadas
        FROM produccion p
        LEFT JOIN produccion_maquinas pm 
            ON p.id = pm.produccion_id
        LEFT JOIN usuarios u 
            ON p.usuario_id = u.id
        GROUP BY 
            p.id,
            p.producto,
            p.numero_pedido,
            p.codigo,
            p.cantidad,
            p.fecha,
            p.turno,
            u.nombre
        ORDER BY p.id DESC
        LIMIT 5";
$res = $conn->query($sql);

$ultimos = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $ultimos[] = $row;
    }
}
/* =========================
   EFICIENCIA GENERAL
   Producción del período / meta del período
========================= */

$metaDiaria = 100;

/* Producción según filtro activo */
$sql = "SELECT SUM(cantidad) AS total 
        FROM produccion 
        WHERE $wherePeriodo";

$res = $conn->query($sql);
$produccionPeriodo = ($res && $row = $res->fetch_assoc()) ? intval($row["total"] ?? 0) : 0;

/* Meta según período */
$metaPeriodo = $metaDiaria;
$eficienciaTexto = "Producción vs meta diaria";
$eficienciaDetalle = "Meta diaria: " . $metaDiaria . " piezas";

if ($periodo === "ayer") {
    $metaPeriodo = $metaDiaria;
    $eficienciaTexto = "Producción vs meta de ayer";
    $eficienciaDetalle = "Meta diaria: " . $metaPeriodo . " piezas";
}

if ($periodo === "semana") {
    $metaPeriodo = $metaDiaria * 7;
    $eficienciaTexto = "Producción vs meta semanal";
    $eficienciaDetalle = "Meta semanal: " . $metaPeriodo . " piezas";
}

if ($periodo === "mes") {
    $diasMesTranscurridos = intval(date("j"));
    $metaPeriodo = $metaDiaria * $diasMesTranscurridos;

    $eficienciaTexto = "Producción vs meta mensual";
    $eficienciaDetalle = "Meta acumulada: " . $metaPeriodo . " piezas";
}

if ($periodo === "fecha") {
    $metaPeriodo = $metaDiaria;
    $eficienciaTexto = "Producción vs meta de la fecha";
    $eficienciaDetalle = "Meta diaria: " . $metaPeriodo . " piezas";
}

$eficiencia = $metaPeriodo > 0 ? round(($produccionPeriodo / $metaPeriodo) * 100) : 0;

/* RESPUESTA FINAL */
$response["cards"] = [
    "total_productos" => $totalProductos,
    "total_productos_general" => $totalProductosGeneral,
    "total_productos_texto" => $totalProductosTexto,
    "total_productos_detalle" => $totalProductosDetalle,

    "productos_proceso" => $productosProceso,
    "productos_proceso_texto" => $productosProcesoTexto,
    "productos_proceso_detalle" => $productosProcesoDetalle,

    "maquinas_operativas" => $maquinasOperativas,
    "maquinas_detenidas" => $maquinasDetenidas,
    "porcentaje_operativas" => $porcentajeOperativas,
    "porcentaje_detenidas" => $porcentajeDetenidas,
    "lista_maquinas_operativas" => $listaMaquinasOperativas,
    "lista_maquinas_detenidas" => $listaMaquinasDetenidas,
    "horas_trabajadas" => $horasTrabajadas . "h " . str_pad($minutosTrabajados, 2, "0", STR_PAD_LEFT) . "m",
    "horas_trabajadas_texto" => $horasTrabajadasTexto,
    "horas_trabajadas_detalle" => $horasTrabajadasDetalle,

    "eficiencia" => $eficiencia,
    "eficiencia_texto" => $eficienciaTexto,
    "eficiencia_detalle" => $eficienciaDetalle,
    "produccion_periodo" => $produccionPeriodo,
    "meta_periodo" => $metaPeriodo,

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
$response["grafico_produccion_titulo"] = $graficoProduccionTitulo;

$response["tiempo_detenido"] = [
    "total" => formatearMinutos($totalMinutosDetenidas),
    "promedio" => formatearMinutos($promedioMinutosDetenidas)
];

$response["resumen"] = [
    "operativas" => $maquinasOperativas,
    "en_proceso" => $productosProceso,
    "detenidas" => $maquinasDetenidas,
    "total" => $totalMaquinas
];

$response["fallas"] = $fallas;
$response["top_maquinas"] = $topMaquinas;

/* TOP USUARIOS */
$sql = "SELECT 
            COALESCE(u.nombre, 'Admin') AS usuario,
            SUM(p.cantidad) AS total
        FROM produccion p
        LEFT JOIN usuarios u ON p.usuario_id = u.id
        GROUP BY usuario
        ORDER BY total DESC
        LIMIT 3";

$res = $conn->query($sql);

$topUsuarios = [];

if ($res) {
    while ($row = $res->fetch_assoc()) {
        $topUsuarios[] = [
            "usuario" => $row["usuario"],
            "total" => intval($row["total"] ?? 0)
        ];
    }
}

$response["top_usuarios"] = $topUsuarios;

$response["estado_produccion"] = [
    "completados" => $completados,
    "en_proceso" => $enProceso,
    "atrasados" => $atrasados
];

$response["tiempo_detenido"] = [
    "total" => formatearMinutos($totalMinutosDetenidas),
    "promedio" => formatearMinutos($promedioMinutosDetenidas)
];

$response["ultimos_registros"] = $ultimos;

echo json_encode($response);
$conn->close();
?>