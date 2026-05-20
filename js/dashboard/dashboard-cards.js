/* =========================
   CARDS SUPERIORES
========================= */
function cargarCards(cards) {
    /* =========================
       PRODUCTOS
    ========================= */
    actualizarTexto("dashTotalProductos", cards.total_productos ?? 0);
    actualizarTexto("dashTotalProductosTexto", cards.total_productos_texto ?? "Registrados en el sistema");
    actualizarTexto("dashTotalProductosDetalle", cards.total_productos_detalle ?? "");

    actualizarTexto("dashProductosProceso", cards.productos_proceso ?? 0);
    actualizarTexto("dashProductosProcesoTexto", cards.productos_proceso_texto ?? "Producción activa actualmente");
    actualizarTexto("dashProductosProcesoDetalle", cards.productos_proceso_detalle ?? "Según fecha estimada de término");

    /* =========================
       MÁQUINAS
    ========================= */

    const operativas = Number(cards.maquinas_operativas ?? 0);
    const mantencion = Number(cards.maquinas_mantencion ?? 0);
    const detenidas = Number(cards.maquinas_detenidas ?? 0);

    const totalMaquinas = Number(
        cards.total_maquinas ??
        cards.maquinas_total ??
        (operativas + mantencion + detenidas)
    );

    actualizarTexto("dashMaquinasTotal", totalMaquinas);

    actualizarTexto("dashMaquinasOperativas", operativas);
    actualizarTexto("dashMaquinasMantencion", mantencion);
    actualizarTexto("dashMaquinasDetenidas", detenidas);

    actualizarTexto(
        "dashMaquinasOperativasDetalle",
        `${cards.porcentaje_operativas ?? calcularPorcentaje(operativas, totalMaquinas)}%`
    );

    actualizarTexto(
        "dashMaquinasMantencionDetalle",
        `${cards.porcentaje_mantencion ?? calcularPorcentaje(mantencion, totalMaquinas)}%`
    );

    actualizarTexto(
        "dashMaquinasDetenidasDetalle",
        `${cards.porcentaje_detenidas ?? calcularPorcentaje(detenidas, totalMaquinas)}%`
    );

    /* =========================
       HORAS / EFICIENCIA
    ========================= */
    actualizarTexto("dashHorasTrabajadas", cards.horas_trabajadas ?? "0h 00m");
    actualizarTexto("dashHorasTrabajadasTexto", cards.horas_trabajadas_texto ?? "Tiempo trabajado hoy");
    actualizarTexto("dashHorasTrabajadasDetalle", cards.horas_trabajadas_detalle ?? "Según máquinas utilizadas");

    actualizarTexto("dashEficiencia", `${cards.eficiencia ?? 0}%`);
    actualizarTexto("dashEficienciaTexto", cards.eficiencia_texto ?? "Producción vs meta diaria");
    actualizarTexto("dashEficienciaDetalle", cards.eficiencia_detalle ?? "Meta diaria: 100 piezas");

    /* =========================
       RESUMEN RÁPIDO
       Se actualiza si existen esos IDs
    ========================= */
    actualizarTexto("donutTotal", totalMaquinas);
    actualizarTexto("resumenOperativas", operativas);

    // Si luego cambias el HTML a resumenMantencion, lo toma.
    // Si todavía tienes resumenProceso, también lo actualiza.
    actualizarTexto("resumenMantencion", mantencion);
    actualizarTexto("resumenProceso", mantencion);

    actualizarTexto("resumenDetenidas", detenidas);

    /* =========================
       LISTAS PARA DROPDOWN
    ========================= */
    window.maquinasDashboardCache = {
        operativas: cards.lista_maquinas_operativas ?? [],
        mantencion: cards.lista_maquinas_mantencion ?? [],
        detenidas: cards.lista_maquinas_detenidas ?? []
    };

    window.maquinasDashboardCache.todas = [
        ...window.maquinasDashboardCache.operativas,
        ...window.maquinasDashboardCache.mantencion,
        ...window.maquinasDashboardCache.detenidas
    ];
}

/* =========================
   CALCULAR PORCENTAJE
========================= */
function calcularPorcentaje(valor, total) {
    if (!total || total <= 0) return 0;
    return Math.round((valor / total) * 100);
}

/* =========================
   LISTAS DE MÁQUINAS EN CARD UNIFICADA
========================= */
function renderListaMaquinasDashboard(tipo, maquinas) {
    const contenedor = document.getElementById("listaEstadoMaquinas");
    const titulo = document.getElementById("tituloEstadoMaquinas");
    const dot = document.getElementById("dotEstadoMaquinas");

    if (!contenedor) return;

    const config = obtenerConfigListaMaquinas(tipo);

    if (titulo) {
        titulo.textContent = `${config.titulo} (${maquinas.length})`;
    }

    if (dot) {
        dot.className = `status-dot-card ${config.dotClass}`;
    }

    if (!maquinas.length) {
        contenedor.innerHTML = `
            <p class="maquinas-empty">
                ${config.mensajeVacio}
            </p>
        `;
        return;
    }

    contenedor.innerHTML = maquinas.map(maquina => {
        const nombre = maquina.nombre_maquina || "Sin nombre";
        const zona = maquina.zona || "Sin zona";

        return `
            <div class="maquina-row-card">
                <strong>${nombre}</strong>
                <span>${zona}</span>
                <span class="estado-maquina-card ${config.estadoClass}">
                    ${config.estadoTexto}
                </span>
            </div>
        `;
    }).join("");
}

/* =========================
   CONFIGURACIÓN DE LISTAS
========================= */
function obtenerConfigListaMaquinas(tipo) {
    const configs = {
        operativas: {
            titulo: "Máquinas operativas",
            estadoTexto: "Operativa",
            estadoClass: "estado-operativa",
            dotClass: "green-dot-card",
            mensajeVacio: "Sin máquinas operativas"
        },

        mantencion: {
            titulo: "Máquinas en mantención",
            estadoTexto: "Mantención",
            estadoClass: "estado-mantencion",
            dotClass: "yellow-dot-card",
            mensajeVacio: "Sin máquinas en mantención"
        },

        detenidas: {
            titulo: "Máquinas detenidas",
            estadoTexto: "Detenida",
            estadoClass: "estado-detenida",
            dotClass: "red-dot-card",
            mensajeVacio: "Sin máquinas detenidas"
        },

        todas: {
            titulo: "Todas las máquinas",
            estadoTexto: "Registrada",
            estadoClass: "estado-operativa",
            dotClass: "blue-dot-card",
            mensajeVacio: "Sin máquinas registradas"
        }
    };

    return configs[tipo] || configs.todas;
}

/* =========================
   ABRIR / CERRAR DROPDOWN
========================= */
function toggleMaquinasDropdown(tipo = "todas") {
    const cardEstadoMaquinas = document.getElementById("cardEstadoMaquinas");

    if (!cardEstadoMaquinas) return;

    const cache = window.maquinasDashboardCache || {
        operativas: [],
        mantencion: [],
        detenidas: [],
        todas: []
    };

    const maquinas = cache[tipo] ?? cache.todas ?? [];

    renderListaMaquinasDashboard(tipo, maquinas);

    cardEstadoMaquinas.classList.toggle("active");
}

/* =========================
   CERRAR DROPDOWN AL HACER CLICK FUERA
========================= */
document.addEventListener("click", function(e) {
    const cardEstadoMaquinas = document.getElementById("cardEstadoMaquinas");

    if (!cardEstadoMaquinas) return;

    const clickDentro = cardEstadoMaquinas.contains(e.target);

    if (!clickDentro) {
        cardEstadoMaquinas.classList.remove("active");
    }
});

window.toggleMaquinasDropdown = toggleMaquinasDropdown;