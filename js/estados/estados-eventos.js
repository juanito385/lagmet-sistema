/* =========================
   CLICK GLOBAL PARA TABS
   Funciona aunque estados.html se cargue después
========================= */
document.addEventListener("click", function (e) {

    const tab = e.target.closest(".estado-tab");

    if (tab) {
        const panel = tab.dataset.estadoTab;

        if (!panel) return;

        cambiarPanelEstados(panel);
        return;
    }

    const btnFiltrarProduccion = e.target.closest("#btnFiltrarEstadosProduccion");

    if (btnFiltrarProduccion) {
        filtrarEstadosProduccion();
        return;
    }

    const btnLimpiarProduccion = e.target.closest("#btnLimpiarEstadosProduccion");

    if (btnLimpiarProduccion) {
        limpiarFiltrosEstadosProduccion();
        return;
    }

    const btnEditarEstado = e.target.closest(".btn-editar");

    if (btnEditarEstado && btnEditarEstado.dataset.id) {
        console.log("EDITAR ESTADO CLICK:", btnEditarEstado.dataset.id);
        seleccionarEstadoProduccion(btnEditarEstado.dataset.id);
        return;
    }

    const btnAyudaEstados = e.target.closest("#btnAyudaEstados");

    if (btnAyudaEstados) {
        const boxAyuda = document.getElementById("boxAyudaEstados");

        if (boxAyuda) {
            boxAyuda.classList.toggle("active");
        }

        return;
    }

    const btnAlertaAtraso = e.target.closest(".btn-alerta-atraso");

    if (btnAlertaAtraso) {
        e.stopPropagation();
        mostrarAlertaAtraso(btnAlertaAtraso);
        return;
    }

    const btnCerrarModalEstado = e.target.closest("#btnCerrarModalEstado");

    if (btnCerrarModalEstado) {
        cerrarModalEstado();
        return;
    }

    const modalEstadoOverlay = e.target.closest("#modalEstadoOverlay");
    const modalEstadoCard = e.target.closest("#modalEstadoCard");

    if (modalEstadoOverlay && !modalEstadoCard) {
        cerrarModalEstado();
        return;
    }

});

document.addEventListener("click", function (e) {
    const tooltip = document.querySelector(".tooltip-atraso");

    if (!tooltip) return;

    const clickDentroTooltip = e.target.closest(".tooltip-atraso");
    const clickBotonAlerta = e.target.closest(".btn-alerta-atraso");

    if (!clickDentroTooltip && !clickBotonAlerta) {
        tooltip.remove();
    }
});

document.addEventListener("click", function (e) {
    const ayudaWrap = e.target.closest(".estado-ayuda-wrap");
    const boxAyuda = document.getElementById("boxAyudaEstados");

    if (!ayudaWrap && boxAyuda) {
        boxAyuda.classList.remove("active");
    }

    const btnEstadoTerminado = e.target.closest("#btnEstadoTerminado");

    if (btnEstadoTerminado) {
        cambiarEstadoProduccion(
            "terminado",
            "Trabajo marcado como terminado desde acciones rápidas"
        );
        return;
    }

    const btnEstadoPausado = e.target.closest("#btnEstadoPausado");

    if (btnEstadoPausado) {
        cambiarEstadoProduccion(
            "pausado",
            "Trabajo pausado desde acciones rápidas"
        );
        return;
    }

    const btnEstadoProceso = e.target.closest("#btnEstadoProceso");

    if (btnEstadoProceso) {
        cambiarEstadoProduccion(
            "en_proceso",
            "Trabajo reanudado desde acciones rápidas"
        );
        return;
    }

    const btnEstadoEntregado = e.target.closest("#btnEstadoEntregado");

    if (btnEstadoEntregado) {
        cambiarEstadoProduccion(
            "entregado",
            "Trabajo marcado como entregado desde acciones rápidas"
        );
        return;
    }
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        cerrarModalEstado();
    }
});

document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;

    const inputBuscar = e.target.closest("#filtroEstadoBuscar");

    if (inputBuscar) {
        filtrarEstadosProduccion();
    }
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
