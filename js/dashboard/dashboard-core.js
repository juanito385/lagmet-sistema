/* =========================
   DASHBOARD LAGMET
========================= */

async function cargarDashboard() {
    cargarFechaDashboard();
    await cargarDatosDashboard(periodoDashboardActual);
}

function obtenerFechaISOHoy() {
    const fecha = new Date();
    return fecha.toISOString().split("T")[0];
}

function formatearFechaDashboard(fechaISO) {
    if (!fechaISO) return "--";

    const fecha = new Date(`${fechaISO}T00:00:00`);

    const opciones = {
        day: "2-digit",
        month: "long",
        year: "numeric"
    };

    return fecha.toLocaleDateString("es-CL", opciones);
}

/* =========================
   FECHA DASHBOARD
========================= */
function cargarFechaDashboard(fechaISO = null) {
    const fechaFinal = fechaISO || obtenerFechaISOHoy();
    const fechaTexto = formatearFechaDashboard(fechaFinal);

    actualizarTexto("fechaDashboard", fechaTexto);

    const inputFecha = document.getElementById("fechaFiltroDashboard");

    if (inputFecha && !inputFecha.value) {
        inputFecha.value = fechaFinal;
    }
}

/* =========================
   DATOS DESDE BD
========================= */
async function cargarDatosDashboard(periodo = "hoy", fecha = null) {
    try {
        const params = new URLSearchParams();
        params.append("periodo", periodo);

        if (periodo === "fecha" && fecha) {
            params.append("fecha", fecha);
        }

        const response = await fetch(`php/dashboard/obtener_dashboard.php?${params.toString()}`);
        const data = await response.json();

        console.log("DASHBOARD DATA:", data);

        if (!data.success) {
            console.error("Error dashboard:", data.message);
            return;
        }

        cargarCards(data.cards);
        cargarTurnos(data.turnos);
        cargarComparacion(data.comparacion);
        cargarProduccionSemanal(data.semana);

        actualizarTexto(
            "tituloGraficoProduccion",
            `📈 ${data.grafico_produccion_titulo ?? "Producción últimos 7 días"}`
        );

        cargarResumenRapido(data.resumen);
        cargarTiempoDetenido(data.tiempo_detenido);
        cargarFallas(data.fallas);
        cargarTopMaquinas(data.top_maquinas);
        cargarTopUsuarios(data.top_usuarios);
        cargarEstadoProduccion(data.estado_produccion);
        cargarUltimosRegistros(data.ultimos_registros);

    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
} 