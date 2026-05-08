/* =========================
   DASHBOARD LAGMET
========================= */

async function cargarDashboard() {
    cargarFechaDashboard();
    await cargarDatosDashboard(periodoDashboardActual);
}

/* =========================
   FECHA DASHBOARD
========================= */
function cargarFechaDashboard() {
    const fecha = new Date();

    const opciones = {
        day: "2-digit",
        month: "long",
        year: "numeric"
    };

    const fechaTexto = fecha.toLocaleDateString("es-CL", opciones);
    actualizarTexto("fechaDashboard", fechaTexto);
}

/* =========================
   DATOS DESDE BD
========================= */
async function cargarDatosDashboard(periodo = "hoy") {
    try {
        const response = await fetch(`php/dashboard/obtener_dashboard.php?periodo=${periodo}`);
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