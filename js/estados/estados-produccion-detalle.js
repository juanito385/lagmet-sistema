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

    /*
       Si hubo cambios dentro del modal, refrescamos la tabla/cards
       después de cerrar para evitar parpadeos o vibración visual.
    */
    if (estadosProduccionNecesitaRefresco) {
        estadosProduccionNecesitaRefresco = false;

        setTimeout(() => {
            cargarCardsEstadosProduccion();
        }, 180);
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
async function cargarHistorialEstadoProduccion(produccionId, mostrarCargando = true) {
    const contenedor = document.getElementById("detalleHistorial");

    if (!contenedor) return;

    /*
       Solo mostramos "Cargando historial..." cuando se abre el modal por primera vez.
       Cuando se actualiza desde acciones rápidas, se mantiene el historial actual
       para evitar parpadeos o vibración visual.
    */
    if (mostrarCargando) {
        contenedor.innerHTML = `
            <div class="historial-vacio">
                <strong>Cargando historial...</strong>
                <p>Consultando cambios registrados.</p>
            </div>
        `;
    }

    try {
        const response = await fetch(`php/estados/obtener_historial_estado.php?produccion_id=${produccionId}`);
        const data = await response.json();

        if (!data.success) {
            contenedor.innerHTML = `
                <div class="historial-vacio">
                    <strong>Error</strong>
                    <p>${escaparHTML(data.message || "No se pudo cargar el historial.")}</p>
                </div>
            `;
            return;
        }

        renderHistorialEstadoProduccion(data.data || []);

    } catch (error) {
        console.error("Error cargando historial:", error);

        contenedor.innerHTML = `
            <div class="historial-vacio">
                <strong>Error de conexión</strong>
                <p>No se pudo consultar el historial de estados.</p>
            </div>
        `;
    }
}

/* =========================
   HELPERS HISTORIAL
========================= */
function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function convertirFechaHistorial(fecha) {
    if (!fecha) return null;

    const fechaNormalizada = String(fecha).replace(" ", "T");
    const fechaObj = new Date(fechaNormalizada);

    if (isNaN(fechaObj.getTime())) {
        return null;
    }

    return fechaObj;
}

function formatearFechaGrupoHistorial(fecha) {
    const fechaObj = convertirFechaHistorial(fecha);

    if (!fechaObj) return "Sin fecha";

    return fechaObj.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function obtenerGrupoFechaHistorial(fecha) {
    const fechaItem = convertirFechaHistorial(fecha);

    if (!fechaItem) return "Sin fecha";

    const hoy = new Date();
    const ayer = new Date();

    ayer.setDate(hoy.getDate() - 1);

    const fechaFormateada = formatearFechaGrupoHistorial(fecha);

    const mismoDia =
        fechaItem.getDate() === hoy.getDate() &&
        fechaItem.getMonth() === hoy.getMonth() &&
        fechaItem.getFullYear() === hoy.getFullYear();

    const mismoAyer =
        fechaItem.getDate() === ayer.getDate() &&
        fechaItem.getMonth() === ayer.getMonth() &&
        fechaItem.getFullYear() === ayer.getFullYear();

    if (mismoDia) {
        return `${fechaFormateada} - Hoy`;
    }

    if (mismoAyer) {
        return `${fechaFormateada} - Ayer`;
    }

    return fechaFormateada;
}

function formatearSoloHoraHistorial(fecha) {
    const fechaObj = convertirFechaHistorial(fecha);

    if (!fechaObj) return "Sin hora";

    return fechaObj.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

function normalizarEstadoHistorial(estado) {
    return String(estado || "pendiente")
        .trim()
        .toLowerCase()
        .replaceAll(" ", "_")
        .replaceAll("-", "_");
}

function obtenerIconoHistorialEstado(estado) {
    const estadoNormalizado = normalizarEstadoHistorial(estado);

    switch (estadoNormalizado) {
        case "pendiente":
        case "creado":
        case "programado":
            return "more_horiz";

        case "en_proceso":
        case "proceso":
        case "reanudado":
            return "play_arrow";

        case "pausado":
            return "pause";

        case "terminado":
        case "completado":
            return "check";

        case "entregado":
        case "marcado_como_entregado":
            return "local_shipping";

        case "atrasado":
            return "timer";

        default:
            return "radio_button_unchecked";
    }
}

function obtenerTooltipHistorialEstado(estado) {
    const estadoNormalizado = normalizarEstadoHistorial(estado);

    switch (estadoNormalizado) {
        case "pendiente":
            return "Pendiente";

        case "creado":
            return "Creado";

        case "programado":
            return "Programado";

        case "en_proceso":
        case "proceso":
            return "En proceso";

        case "reanudado":
            return "Reanudado";

        case "pausado":
            return "Pausado";

        case "terminado":
        case "completado":
            return "Terminado";

        case "entregado":
        case "marcado_como_entregado":
            return "Entregado";

        case "atrasado":
            return "Atrasado";

        default:
            return formatearTextoEstado(estado || "pendiente");
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
            <div class="historial-vacio">
                <strong>Sin historial</strong>
                <p>Esta producción todavía no tiene cambios de estado registrados.</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = "";

    /*
       La card del modal solo muestra un resumen.
       El historial completo se dejará para el botón "Ver historial completo".
    */
    const historialPreview = historial.slice(0, 3);

    const grupos = {};

    historialPreview.forEach(item => {
        const grupo = obtenerGrupoFechaHistorial(item.fecha_cambio);

        if (!grupos[grupo]) {
            grupos[grupo] = [];
        }

        grupos[grupo].push(item);
    });

    const wrapper = document.createElement("div");
    wrapper.className = "historial-compacto";

    wrapper.innerHTML = `
        <div class="historial-header-columnas">
            <div class="col-estado">Estado</div>
            <div class="col-fecha">Hora</div>
            <div class="col-detalle">Detalle</div>
        </div>
    `;

    const ordenGrupos = Object.keys(grupos);

    ordenGrupos.forEach(nombreGrupo => {
        const bloque = document.createElement("div");
        bloque.className = "historial-bloque-dia";

        const titulo = document.createElement("div");
        titulo.className = "historial-dia";
        titulo.innerHTML = `
            <span class="material-symbols-outlined">calendar_month</span>
            <span>${escaparHTML(nombreGrupo)}</span>
        `;

        bloque.appendChild(titulo);

        grupos[nombreGrupo].forEach(item => {
            const estado = item.estado_nuevo || "pendiente";
            const clase = obtenerClaseTimelineEstado(estado);
            const icono = obtenerIconoHistorialEstado(estado);
            const tooltip = obtenerTooltipHistorialEstado(estado);
            const observacion = item.observacion || "Cambio de estado registrado";
            const usuario = item.usuario_nombre || "Admin";

            const fila = document.createElement("div");
            fila.className = `historial-fila ${clase}`;

            fila.innerHTML = `
                <div class="historial-col historial-col-estado">
                    <div class="historial-estado-info">
                        <span 
                            class="historial-icono material-symbols-outlined ${clase}"
                            title="${escaparHTML(tooltip)}"
                            aria-label="${escaparHTML(tooltip)}"
                            data-tooltip="${escaparHTML(tooltip)}"
                        >
                            ${icono}
                        </span>
                    </div>
                </div>

                <div class="historial-col historial-col-fecha">
                    <div class="historial-fecha-wrap">
                        <strong>${formatearSoloHoraHistorial(item.fecha_cambio)}</strong>
                    </div>
                </div>

                <div class="historial-col historial-col-detalle">
                    <div class="historial-detalle-wrap">
                        <span>${escaparHTML(observacion)}</span>
                        <small>${escaparHTML(usuario)}</small>
                    </div>
                </div>
            `;

            bloque.appendChild(fila);
        });

        wrapper.appendChild(bloque);
    });

    const footer = document.createElement("div");
    footer.className = "historial-footer";
    footer.innerHTML = `
        <button type="button" class="btn-historial-completo">
            Ver historial completo
        </button>
    `;

    wrapper.appendChild(footer);
    contenedor.appendChild(wrapper);
}