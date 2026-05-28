/* =========================
   PANEL ACCIONES GANTT
========================= */

async function cargarPanelAccionesGantt(){

    const contenedor = document.getElementById("contenedorPanelAccionesGantt");

    if (!contenedor) return;

    try {
        const respuesta = await fetch(`views/documentacion/gantt-acciones-panel.html?v=${Date.now()}`, {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar gantt-acciones-panel.html");
        }

        contenedor.innerHTML = await respuesta.text();

    } catch (error) {
        console.error("Error cargando panel de acciones Gantt:", error);
    }
}

function abrirPanelAccionesGantt(){
    const panel = document.getElementById("panelAccionesGantt");
    if (panel) panel.classList.add("active");
}

function cerrarPanelAccionesGantt(){
    const panel = document.getElementById("panelAccionesGantt");
    if (panel) panel.classList.remove("active");
}

function togglePanelAccionesGantt(){
    const panel = document.getElementById("panelAccionesGantt");
    if (panel) panel.classList.toggle("active");
}

function limpiarFiltrosPanelGantt(){

    const filtroMaquina = document.getElementById("filtroPanelMaquinaGantt");
    const filtroOperador = document.getElementById("filtroPanelOperadorGantt");
    const filtroEstado = document.getElementById("filtroPanelEstadoGantt");

    if (filtroMaquina) filtroMaquina.value = "todas";
    if (filtroOperador) filtroOperador.value = "todos";
    if (filtroEstado) filtroEstado.value = "todos";

    mostrarGanttPorMaquina();
}

window.cargarPanelAccionesGantt = cargarPanelAccionesGantt;
window.abrirPanelAccionesGantt = abrirPanelAccionesGantt;
window.cerrarPanelAccionesGantt = cerrarPanelAccionesGantt;
window.togglePanelAccionesGantt = togglePanelAccionesGantt;
window.limpiarFiltrosPanelGantt = limpiarFiltrosPanelGantt;