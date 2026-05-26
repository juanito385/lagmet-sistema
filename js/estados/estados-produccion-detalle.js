function mostrarAlertaAtraso(boton) {
    const alertaAbierta = document.querySelector(".tooltip-atraso");

    if (alertaAbierta) {
        alertaAbierta.remove();
    }

    const fecha = boton.dataset.fecha || "Sin fecha";

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip-atraso";

    tooltip.innerHTML = `
        <strong>
            <span class="material-symbols-outlined">warning</span>
            Está atrasado
        </strong>
        <p>La fecha fin estimada (${fecha}) ya ha pasado.</p>
        <small>Haz clic fuera para cerrar</small>
    `;

    document.body.appendChild(tooltip);

    const rect = boton.getBoundingClientRect();

    tooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
    tooltip.style.left = `${rect.left + window.scrollX - 120}px`;
}

/* =========================
   MODAL DETALLE ESTADO
========================= */
function abrirModalEstado() {
    const modal = document.getElementById("modalEstadoOverlay");

    if (modal) {
        modal.classList.add("active");
    }
}

function cerrarModalEstado() {
    const modal = document.getElementById("modalEstadoOverlay");

    if (modal) {
        modal.classList.remove("active");
    }
}

/* =========================
   SELECCIONAR PRODUCCIÓN
   Carga detalle inferior + historial
========================= */
function seleccionarEstadoProduccion(id) {
    const item = estadosProduccionData.find(registro => String(registro.id) === String(id));

    if (!item) {
        console.warn("No se encontró la producción seleccionada:", id);
        return;
    }

    estadoProduccionSeleccionada = item;

    abrirModalEstado();

    cargarDetalleEstadoProduccion(item);
    cargarHistorialEstadoProduccion(item.id);
}

/* =========================
   CARGAR DETALLE INFERIOR
========================= */
function cargarDetalleEstadoProduccion(item) {
    const estado = item.estado_actual || "pendiente";

    const progreso = calcularProgresoEstado(
        estado,
        item.fecha_inicio,
        item.fecha_fin_estimada
    );

    actualizarTextoEstado("detalleOT", item.orden || "Sin orden");
    actualizarTextoEstado("detalleProducto", item.producto || "Sin producto");
    actualizarTextoEstado("detalleMaquina", item.maquina || "Sin máquina");
    actualizarTextoEstado("detalleInicio", formatearFechaEstado(item.fecha_inicio));
    actualizarTextoEstado("detalleFechaEstimada", formatearFechaHoraEstado(item.fecha_fin_estimada));
    actualizarTextoEstado("detalleFechaReal", formatearFechaHoraEstado(item.fecha_fin_real));
    actualizarTextoEstado("detalleOperador", item.operador || "Admin");
    actualizarTextoEstado("detalleProgresoTexto", `${progreso}%`);

    const badge = document.getElementById("detalleEstadoBadge");

    if (badge) {
        badge.textContent = formatearTextoEstado(estado);
        badge.className = `badge ${obtenerClaseBadgeEstado(estado)}`;
    }

    const icono = document.getElementById("detalleEstadoIcono");

    if (icono) {
        icono.textContent = obtenerIconoEstado(estado);
        icono.className = `detalle-check material-symbols-outlined ${obtenerClaseIconoEstado(estado)}`;
    }

    const barra = document.getElementById("detalleProgresoBarra");

    if (barra) {
        barra.style.width = `${progreso}%`;
    }
}

/* =========================
   CARGAR HISTORIAL REAL
========================= */
async function cargarHistorialEstadoProduccion(produccionId) {
    const contenedor = document.getElementById("detalleHistorial");

    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="timeline-item blue">
            <span></span>
            <div>
                <strong>Cargando historial...</strong>
                <p>Consultando cambios registrados.</p>
            </div>
        </div>
    `;

    try {
        const response = await fetch(`php/estados/obtener_historial_estado.php?produccion_id=${produccionId}`);
        const data = await response.json();

        if (!data.success) {
            contenedor.innerHTML = `
                <div class="timeline-item red">
                    <span></span>
                    <div>
                        <strong>Error</strong>
                        <p>${data.message || "No se pudo cargar el historial."}</p>
                    </div>
                </div>
            `;
            return;
        }

        renderHistorialEstadoProduccion(data.data || []);

    } catch (error) {
        console.error("Error cargando historial:", error);

        contenedor.innerHTML = `
            <div class="timeline-item red">
                <span></span>
                <div>
                    <strong>Error de conexión</strong>
                    <p>No se pudo consultar el historial de estados.</p>
                </div>
            </div>
        `;
    }
}

/* =========================
   RENDER HISTORIAL
========================= */
function renderHistorialEstadoProduccion(historial) {
    const contenedor = document.getElementById("detalleHistorial");

    if (!contenedor) return;

    if (!historial || historial.length === 0) {
        contenedor.innerHTML = `
            <div class="timeline-item blue">
                <span></span>
                <div>
                    <strong>Sin historial</strong>
                    <p>Esta producción todavía no tiene cambios de estado registrados.</p>
                </div>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = "";

    historial.forEach(item => {
        const estado = item.estado_nuevo || "pendiente";
        const clase = obtenerClaseTimelineEstado(estado);

        const fila = document.createElement("div");
        fila.className = `timeline-item ${clase}`;

        fila.innerHTML = `
            <span></span>
            <div>
                <strong>${formatearTextoEstado(estado)}</strong>
                <p>
                    ${formatearFechaHoraEstado(item.fecha_cambio)}
                    - ${item.observacion || "Cambio de estado registrado"}
                    - ${item.usuario_nombre || "Admin"}
                </p>
            </div>
        `;

        contenedor.appendChild(fila);
    });
}
