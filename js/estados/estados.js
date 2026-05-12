/* =========================
   ESTADOS - IRONIX
   Producción / Máquinas + Cards BD
========================= */

/* =========================
   CAMBIAR PANEL
========================= */
function cambiarPanelEstados(panel) {
    const seccionEstados = document.querySelector(".estados-section");

    if (!seccionEstados) return;

    const tabs = seccionEstados.querySelectorAll(".estado-tab");
    const vistas = seccionEstados.querySelectorAll(".estado-vista");

    tabs.forEach(tab => {
        tab.classList.remove("active");

        if (tab.dataset.estadoTab === panel) {
            tab.classList.add("active");
        }
    });

    vistas.forEach(vista => {
        vista.classList.remove("active");
    });

    const vistaActiva = seccionEstados.querySelector(`#vista-estados-${panel}`);

    if (vistaActiva) {
        vistaActiva.classList.add("active");
    }

    if (panel === "produccion") {
        cargarCardsEstadosProduccion();
    }
}

/* =========================
   CARGAR CARDS PRODUCCIÓN
========================= */
async function cargarCardsEstadosProduccion() {
    try {
        console.log("Cargando cards estados producción...");

        const response = await fetch("php/estados/obtener_estados_produccion.php");
        const data = await response.json();

        console.log("ESTADOS PRODUCCIÓN:", data);

        if (!data.success) {
            console.error("Error estados producción:", data.message);
            return;
        }

        const pendiente = document.getElementById("estadoPendiente");
        const proceso = document.getElementById("estadoProceso");
        const pausado = document.getElementById("estadoPausado");
        const terminado = document.getElementById("estadoTerminado");
        const entregado = document.getElementById("estadoEntregado");
        const atrasado = document.getElementById("estadoAtrasado");

        if (pendiente) pendiente.textContent = data.cards.pendiente ?? 0;
        if (proceso) proceso.textContent = data.cards.en_proceso ?? 0;
        if (pausado) pausado.textContent = data.cards.pausado ?? 0;
        if (terminado) terminado.textContent = data.cards.terminado ?? 0;
        if (entregado) entregado.textContent = data.cards.entregado ?? 0;
        if (atrasado) atrasado.textContent = data.cards.atrasado ?? 0;

    } catch (error) {
        console.error("Error cargando cards de estados:", error);
    }
}

/* =========================
   CLICK GLOBAL PARA TABS
   Funciona aunque estados.html se cargue después
========================= */
document.addEventListener("click", function (e) {
    const tab = e.target.closest(".estado-tab");

    if (!tab) return;

    const panel = tab.dataset.estadoTab;

    if (!panel) return;

    cambiarPanelEstados(panel);
});

/* =========================
   DETECTAR CUANDO APARECE ESTADOS
========================= */
const observerEstados = new MutationObserver(() => {
    const seccionEstados = document.querySelector(".estados-section");

    if (!seccionEstados) return;

    if (seccionEstados.dataset.cardsCargadas === "true") return;

    seccionEstados.dataset.cardsCargadas = "true";
    cargarCardsEstadosProduccion();
});

observerEstados.observe(document.body, {
    childList: true,
    subtree: true
});

/* =========================
   INTENTO DIRECTO POR SI YA ESTÁ CARGADO
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const seccionEstados = document.querySelector(".estados-section");

    if (seccionEstados) {
        cargarCardsEstadosProduccion();
    }
});