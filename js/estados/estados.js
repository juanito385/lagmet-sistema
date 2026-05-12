/* =========================
   ESTADOS - IRONIX
   Tabs Producción / Máquinas
========================= */

function iniciarEstados() {
    const seccionEstados = document.querySelector(".estados-section");

    if (!seccionEstados) return;

    // Evita duplicar eventos si la función se llama más de una vez
    if (seccionEstados.dataset.estadosInit === "true") return;
    seccionEstados.dataset.estadosInit = "true";

    const tabs = seccionEstados.querySelectorAll(".estado-tab");
    const vistas = seccionEstados.querySelectorAll(".estado-vista");

    if (!tabs.length || !vistas.length) return;

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const panel = tab.dataset.estadoTab;

            cambiarPanelEstados(panel);
        });
    });
}

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

    const vistaActiva = document.getElementById(`vista-estados-${panel}`);

    if (vistaActiva) {
        vistaActiva.classList.add("active");
    }

    /*
        Más adelante aquí podemos cargar datos reales desde BD:

        if (panel === "produccion") {
            cargarEstadosProduccion();
        }

        if (panel === "maquinas") {
            cargarEstadosMaquinas();
        }
    */
}

/* =========================
   ESTADOS - IRONIX
   Cambio de panel Producción / Máquinas
========================= */

(function () {

    if (window.__estadosTabsInit) return;
    window.__estadosTabsInit = true;

    document.addEventListener("click", function (e) {

        const tab = e.target.closest(".estado-tab");

        if (!tab) return;

        const section = tab.closest(".estados-section");

        if (!section) return;

        const panel = tab.dataset.estadoTab;

        if (!panel) return;

        const tabs = section.querySelectorAll(".estado-tab");
        const vistas = section.querySelectorAll(".estado-vista");

        tabs.forEach(item => {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        vistas.forEach(vista => {
            vista.classList.remove("active");
        });

        const vistaActiva = section.querySelector(`#vista-estados-${panel}`);

        if (vistaActiva) {
            vistaActiva.classList.add("active");
        }

    });

})();

/* =========================
   INICIAR AL CARGAR
========================= */

document.addEventListener("DOMContentLoaded", () => {
    iniciarEstados();
});

