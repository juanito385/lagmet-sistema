/* =========================
   ESTADOS - IRONIX
   Producción / Máquinas + Cards BD + Tabla Producción
========================= */

let estadosProduccionData = [];
let estadoProduccionSeleccionada = null;

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
   CARGAR CARDS + TABLA PRODUCCIÓN
========================= */
async function cargarCardsEstadosProduccion() {
    try {
        console.log("Cargando estados producción...");

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

        estadosProduccionData = data.data || [];
        renderTablaEstadosProduccion(estadosProduccionData);

    } catch (error) {
        console.error("Error cargando estados de producción:", error);
    }
}

/* =========================
   RENDER TABLA PRODUCCIÓN
========================= */
function renderTablaEstadosProduccion(registros) {
    const tbody = document.getElementById("tablaEstadosProduccion");
    const resumen = document.getElementById("resumenEstadosProduccion");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (!registros || registros.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">No hay registros de producción disponibles.</td>
            </tr>
        `;

        if (resumen) {
            resumen.textContent = "Mostrando 0 registros";
        }

        return;
    }

    registros.forEach(item => {
        const estado = item.estado_actual || "pendiente";
        const mostrarAlertaAtraso = item.esta_atrasado === true;

        const progreso = calcularProgresoEstado(
            estado,
            item.fecha_inicio,
            item.fecha_fin_estimada
        );

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${item.orden || "Sin orden"}</td>
            <td>${item.producto || "Sin producto"}</td>
            <td>${item.maquina || "Sin máquina"}</td>
            <td>${formatearFechaEstado(item.fecha_inicio)}</td>
            <td>${formatearFechaEstado(item.fecha_fin_estimada)}</td>
            <td>
                <div class="estado-con-alerta">
                    <span class="badge ${obtenerClaseBadgeEstado(estado)}">
                        ${formatearTextoEstado(estado)}
                    </span>

                    ${mostrarAlertaAtraso ? `
                        <button 
                            class="btn-alerta-atraso" 
                            type="button"
                            data-fecha="${formatearFechaEstado(item.fecha_fin_estimada)}"
                            title="Producción atrasada"
                        >
                            <span class="material-symbols-outlined">warning</span>
                        </button>
                    ` : ""}
                </div>
            </td>
            <td>
                <div class="progreso-cell">
                    <span>${progreso}%</span>
                    <div class="barra-progreso ${obtenerClaseBarraEstado(estado)}">
                        <div style="width:${progreso}%"></div>
                    </div>
                </div>
            </td>
            <td>
                <button class="btn-editar" type="button" data-id="${item.id}">
                    <span class="material-symbols-outlined">edit</span>
                </button>
            </td>
        `;

        tbody.appendChild(fila);
    });

    if (resumen) {
        resumen.textContent = `Mostrando 1 a ${registros.length} de ${registros.length} resultados`;
    }
}

/* =========================
   FILTRAR TABLA PRODUCCIÓN
========================= */
function filtrarEstadosProduccion() {
    const buscar = document.getElementById("filtroEstadoBuscar")?.value.toLowerCase().trim() || "";
    const estado = document.getElementById("filtroEstadoActual")?.value || "todos";
    const maquina = document.getElementById("filtroEstadoMaquina")?.value.toLowerCase().trim() || "todas";
    const fechaDesde = document.getElementById("filtroEstadoDesde")?.value || "";
    const fechaHasta = document.getElementById("filtroEstadoHasta")?.value || "";

    console.log("FILTRANDO PRODUCCIÓN:", {
        buscar,
        estado,
        maquina,
        fechaDesde,
        fechaHasta,
        totalOriginal: estadosProduccionData.length
    });

    let filtrados = [...estadosProduccionData];

    if (buscar !== "") {
        filtrados = filtrados.filter(item => {
            const orden = (item.orden || "").toLowerCase();
            const producto = (item.producto || "").toLowerCase();
            const codigo = (item.codigo || "").toLowerCase();

            return orden.includes(buscar) ||
                   producto.includes(buscar) ||
                   codigo.includes(buscar);
        });
    }

    if (estado !== "todos") {
        filtrados = filtrados.filter(item => {

            if (estado === "atrasado") {
                return item.esta_atrasado === true;
            }

            return (item.estado_actual || "").toLowerCase() === estado;
        });
    }

    if (maquina !== "todas") {
        filtrados = filtrados.filter(item => {
            const maquinas = (item.maquina || "").toLowerCase();
            return maquinas.includes(maquina);
        });
    }

    if (fechaDesde !== "") {
        filtrados = filtrados.filter(item => {
            const fechaItem = obtenerFechaISOEstado(item.fecha_inicio);
            return fechaItem && fechaItem >= fechaDesde;
        });
    }

    if (fechaHasta !== "") {
        filtrados = filtrados.filter(item => {
            const fechaItem = obtenerFechaISOEstado(item.fecha_inicio);
            return fechaItem && fechaItem <= fechaHasta;
        });
    }

    console.log("RESULTADO FILTRO:", filtrados.length);

    renderTablaEstadosProduccion(filtrados);
}

/* =========================
   LIMPIAR FILTROS PRODUCCIÓN
========================= */
function limpiarFiltrosEstadosProduccion() {
    const buscar = document.getElementById("filtroEstadoBuscar");
    const estado = document.getElementById("filtroEstadoActual");
    const maquina = document.getElementById("filtroEstadoMaquina");
    const fechaDesde = document.getElementById("filtroEstadoDesde");
    const fechaHasta = document.getElementById("filtroEstadoHasta");

    if (buscar) buscar.value = "";
    if (estado) estado.value = "todos";
    if (maquina) maquina.value = "todas";
    if (fechaDesde) fechaDesde.value = "";
    if (fechaHasta) fechaHasta.value = "";

    renderTablaEstadosProduccion(estadosProduccionData);
}

function obtenerFechaISOEstado(fecha) {
    if (!fecha) return "";

    return fecha.split(" ")[0];
}

/* =========================
   HELPERS ESTADOS
========================= */
function obtenerClaseBadgeEstado(estado) {
    const clases = {
        pendiente: "badge-pendiente",
        en_proceso: "badge-proceso",
        pausado: "badge-pausado",
        terminado: "badge-terminado",
        entregado: "badge-entregado",
        atrasado: "badge-atrasado"
    };

    return clases[estado] || "badge-pendiente";
}

function obtenerClaseBarraEstado(estado) {
    const clases = {
        en_proceso: "yellow",
        pausado: "orange",
        atrasado: "red",
        pendiente: "empty"
    };

    return clases[estado] || "";
}

function formatearTextoEstado(estado) {
    const textos = {
        pendiente: "Pendiente",
        en_proceso: "En proceso",
        pausado: "Pausado",
        terminado: "Terminado",
        entregado: "Entregado",
        atrasado: "Atrasado"
    };

    return textos[estado] || "Pendiente";
}

function calcularProgresoEstado(estado, fechaInicio, fechaFin) {
    if (estado === "terminado" || estado === "entregado") return 100;
    if (estado === "pendiente") return 0;

    if (!fechaInicio || !fechaFin) {
        if (estado === "pausado") return 40;
        if (estado === "atrasado") return 75;
        return 50;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const hoy = new Date();

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        return 50;
    }

    const total = fin - inicio;
    const avance = hoy - inicio;

    if (total <= 0) return 100;

    let porcentaje = Math.round((avance / total) * 100);

    if (porcentaje < 0) porcentaje = 0;
    if (porcentaje > 100) porcentaje = 100;

    return porcentaje;
}

function formatearFechaEstado(fecha) {
    if (!fecha) return "Sin fecha";

    const fechaLimpia = fecha.split(" ")[0];
    const partes = fechaLimpia.split("-");

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* =========================
   ALERTA DE ATRASO
========================= */
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

/* =========================
   HELPERS DETALLE / HISTORIAL
========================= */
function actualizarTextoEstado(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor || "—";
    }
}

function formatearFechaHoraEstado(fecha) {
    if (!fecha) return "Sin fecha";

    const partes = fecha.split(" ");
    const fechaBase = partes[0] || "";
    const horaBase = partes[1] || "";

    const fechaFormateada = formatearFechaEstado(fechaBase);

    if (!horaBase) return fechaFormateada;

    const horaCorta = horaBase.substring(0, 5);

    return `${fechaFormateada} ${horaCorta}`;
}

function obtenerIconoEstado(estado) {
    const iconos = {
        pendiente: "schedule",
        en_proceso: "play_circle",
        pausado: "pause_circle",
        terminado: "check_circle",
        entregado: "local_shipping",
        atrasado: "warning"
    };

    return iconos[estado] || "info";
}

function obtenerClaseIconoEstado(estado) {
    const clases = {
        pendiente: "icono-pendiente",
        en_proceso: "icono-proceso",
        pausado: "icono-pausado",
        terminado: "icono-terminado",
        entregado: "icono-entregado",
        atrasado: "icono-atrasado"
    };

    return clases[estado] || "icono-pendiente";
}

function obtenerClaseTimelineEstado(estado) {
    const clases = {
        pendiente: "blue",
        en_proceso: "yellow",
        pausado: "orange",
        terminado: "green",
        entregado: "purple",
        atrasado: "red"
    };

    return clases[estado] || "blue";
}


/* =========================
   CAMBIAR ESTADO DESDE ACCIONES RÁPIDAS
========================= */
async function cambiarEstadoProduccion(nuevoEstado, observacion = "") {
    if (!estadoProduccionSeleccionada) {
        alert("Primero selecciona una orden de trabajo.");
        return;
    }

    const produccionId = estadoProduccionSeleccionada.id;

    try {
        const response = await fetch("php/estados/cambiar_estado.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                produccion_id: produccionId,
                estado: nuevoEstado,
                observacion: observacion
            })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.message || "No se pudo cambiar el estado.");
            return;
        }

        await cargarCardsEstadosProduccion();

        const actualizado = estadosProduccionData.find(
            item => String(item.id) === String(produccionId)
        );

        if (actualizado) {
            estadoProduccionSeleccionada = actualizado;
            cargarDetalleEstadoProduccion(actualizado);
            await cargarHistorialEstadoProduccion(produccionId);
        }

    } catch (error) {
        console.error("Error cambiando estado:", error);
        alert("Error de conexión al cambiar el estado.");
    }
}
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