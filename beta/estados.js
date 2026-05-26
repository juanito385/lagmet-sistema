/* =========================
   ESTADOS - IRONIX
   Producción / Máquinas + Cards BD + Tabla Producción
========================= */

let estadosProduccionData = [];
let estadosProduccionVista = [];
let estadoProduccionSeleccionada = null;
let maquinasEstadosActuales = [];

let paginaActualEstadosProduccion = 1;
const limiteEstadosProduccion = 6;

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

    if (panel === "maquinas") {
        iniciarEstadosMaquinas();
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

    estadosProduccionVista = Array.isArray(registros) ? registros : [];

    tbody.innerHTML = "";

    if (!estadosProduccionVista || estadosProduccionVista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">No hay registros de producción disponibles.</td>
            </tr>
        `;

        if (resumen) {
            resumen.textContent = "Mostrando 0 registros";
        }

        renderPaginacionEstadosProduccion(0);
        return;
    }

    const totalRegistros = estadosProduccionVista.length;
    const totalPaginas = Math.ceil(totalRegistros / limiteEstadosProduccion);

    if (paginaActualEstadosProduccion > totalPaginas) {
        paginaActualEstadosProduccion = totalPaginas;
    }

    if (paginaActualEstadosProduccion < 1) {
        paginaActualEstadosProduccion = 1;
    }

    const inicio = (paginaActualEstadosProduccion - 1) * limiteEstadosProduccion;
    const fin = inicio + limiteEstadosProduccion;

    const registrosPagina = estadosProduccionVista.slice(inicio, fin);

    registrosPagina.forEach(item => {
        const estado = item.estado_actual || "pendiente";
        const mostrarAlertaAtraso = debeMostrarAlertaAtraso(item);

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
        const desde = totalRegistros === 0 ? 0 : inicio + 1;
        const hasta = Math.min(fin, totalRegistros);

        resumen.textContent = `Mostrando ${desde} a ${hasta} de ${totalRegistros} resultados`;
    }

    renderPaginacionEstadosProduccion(totalRegistros);
}

function renderPaginacionEstadosProduccion(totalRegistros) {
    const contenedor = document.getElementById("paginacionEstadosProduccion");

    if (!contenedor) return;

    const totalPaginas = Math.ceil(totalRegistros / limiteEstadosProduccion);

    if (totalPaginas <= 0) {
        contenedor.innerHTML = "";
        return;
    }

    if (paginaActualEstadosProduccion > totalPaginas) {
        paginaActualEstadosProduccion = totalPaginas;
    }

    if (paginaActualEstadosProduccion < 1) {
        paginaActualEstadosProduccion = 1;
    }

    let html = "";

    html += `
        <button 
            type="button"
            class="btn-pagina-estado"
            data-pagina="${paginaActualEstadosProduccion - 1}"
            ${paginaActualEstadosProduccion <= 1 ? "disabled" : ""}>
            ‹
        </button>
    `;

    for (let i = 1; i <= totalPaginas; i++) {
        html += `
            <button 
                type="button"
                class="btn-pagina-estado ${i === paginaActualEstadosProduccion ? "active" : ""}"
                data-pagina="${i}">
                ${i}
            </button>
        `;
    }

    html += `
        <button 
            type="button"
            class="btn-pagina-estado"
            data-pagina="${paginaActualEstadosProduccion + 1}"
            ${paginaActualEstadosProduccion >= totalPaginas ? "disabled" : ""}>
            ›
        </button>
    `;

    contenedor.innerHTML = html;
}

function cambiarPaginaEstadosProduccion(pagina) {
    const totalPaginas = Math.ceil(estadosProduccionVista.length / limiteEstadosProduccion);
    const nuevaPagina = Number(pagina);

    if (!Number.isFinite(nuevaPagina)) return;
    if (nuevaPagina < 1) return;
    if (nuevaPagina > totalPaginas) return;

    paginaActualEstadosProduccion = nuevaPagina;
    renderTablaEstadosProduccion(estadosProduccionVista);
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
                return estaAtrasadoReal(item);
            }

            return normalizarEstadoProduccion(item.estado_actual) === estado;
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

    paginaActualEstadosProduccion = 1;
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

    paginaActualEstadosProduccion = 1;
    renderTablaEstadosProduccion(estadosProduccionData);
}

function obtenerFechaISOEstado(fecha) {
    if (!fecha) return "";

    return fecha.split(" ")[0];
}

function normalizarEstadoProduccion(estado) {
    return String(estado || "pendiente").trim().toLowerCase();
}

function esEstadoFinalizadoProduccion(estado) {
    const estadoNormalizado = normalizarEstadoProduccion(estado);

    return estadoNormalizado === "terminado" ||
           estadoNormalizado === "entregado";
}

function estaAtrasadoReal(item) {
    const estado = normalizarEstadoProduccion(item.estado_actual);

    if (esEstadoFinalizadoProduccion(estado)) {
        return false;
    }

    return item.esta_atrasado === true ||
           item.esta_atrasado === 1 ||
           item.esta_atrasado === "1" ||
           item.esta_atrasado === "true";
}

function normalizarEstadoProduccion(estado) {
    return String(estado || "pendiente").trim().toLowerCase();
}

function fechaISOEstado(fecha) {
    if (!fecha) return "";

    return String(fecha).split(" ")[0];
}

function parseFechaEstado(fecha) {
    const fechaBase = fechaISOEstado(fecha);

    if (!fechaBase) return null;

    const partes = fechaBase.split("-");

    if (partes.length !== 3) return null;

    const anio = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const dia = Number(partes[2]);

    const fechaObjeto = new Date(anio, mes, dia);

    if (isNaN(fechaObjeto.getTime())) return null;

    return fechaObjeto;
}

function fechaMayorQue(fechaA, fechaB) {
    const a = parseFechaEstado(fechaA);
    const b = parseFechaEstado(fechaB);

    if (!a || !b) return false;

    return a.getTime() > b.getTime();
}

function debeMostrarAlertaAtraso(item) {
    const estado = normalizarEstadoProduccion(item.estado_actual);

    const fechaEstimada = item.fecha_fin_estimada;
    const fechaReal = item.fecha_fin_real;

    const estadosFinales = ["terminado", "entregado"];

    /*
       Caso 1:
       Si está terminado o entregado,
       solo se muestra alerta si la fecha real fue posterior a la estimada.
    */
    if (estadosFinales.includes(estado)) {
        return fechaMayorQue(fechaReal, fechaEstimada);
    }

    /*
       Caso 2:
       Si todavía no está terminado/entregado,
       se muestra alerta si el backend ya lo marcó como atrasado.
    */
    return item.esta_atrasado === true ||
           item.esta_atrasado === 1 ||
           item.esta_atrasado === "1" ||
           item.esta_atrasado === "true";
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

    const btnPaginaProduccion = e.target.closest("#paginacionEstadosProduccion .btn-pagina-estado");

    if (btnPaginaProduccion) {
        const pagina = btnPaginaProduccion.dataset.pagina;
        cambiarPaginaEstadosProduccion(pagina);
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

/* =====================================================
   ESTADOS - MÁQUINAS
===================================================== */

let paginaActualEstadosMaquinas = 1;
const limiteEstadosMaquinas = 5;

/* =========================
   INICIAR MÁQUINAS
========================= */
function iniciarEstadosMaquinas() {
    cargarEstadosMaquinas();

    const btnFiltrar = document.getElementById("btnFiltrarEstadosMaquinas");

    if (btnFiltrar && btnFiltrar.dataset.eventoAsignado !== "true") {
        btnFiltrar.dataset.eventoAsignado = "true";

        btnFiltrar.addEventListener("click", () => {
            paginaActualEstadosMaquinas = 1;
            cargarEstadosMaquinas();
        });
    }

    const btnGuardar = document.getElementById("btnGuardarEstadoMaquina");

    if (btnGuardar && btnGuardar.dataset.eventoAsignado !== "true") {
        btnGuardar.dataset.eventoAsignado = "true";

        btnGuardar.addEventListener("click", guardarEstadoMaquina);
    }
    }

/* =========================
   CARGAR MÁQUINAS DESDE BD
========================= */
async function cargarEstadosMaquinas(pagina = paginaActualEstadosMaquinas) {
    const tabla = document.getElementById("tablaEstadosMaquinas");
    const resumenTexto = document.getElementById("resumenEstadosMaquinas");

    if (!tabla) return;

    const tieneFilas = tabla.children.length > 0;

    if (!tieneFilas) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7">Cargando máquinas...</td>
            </tr>
        `;
    } else {
        tabla.classList.add("tabla-cargando-suave");
    }

    try {
        const buscar = document.getElementById("filtroMaquinaBuscar")?.value.trim() || "";
        const estado = document.getElementById("filtroMaquinaEstado")?.value || "todos";
        const zona = document.getElementById("filtroMaquinaZona")?.value || "todas";

        const url = `php/maquinas/obtener_estado_maquinas.php?buscar=${encodeURIComponent(buscar)}&estado=${encodeURIComponent(estado)}&zona=${encodeURIComponent(zona)}&pagina=${pagina}&limite=${limiteEstadosMaquinas}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="7">Error al cargar máquinas</td>
                </tr>
            `;
            console.error(data);
            return;
        }

        paginaActualEstadosMaquinas = data.paginacion.pagina;
        maquinasEstadosActuales = data.data;

        renderResumenEstadosMaquinas(data.resumen);
        renderTablaEstadosMaquinas(data.data);
        renderPaginacionEstadosMaquinas(data.paginacion);

        if (resumenTexto) {
            const total = data.paginacion.total_filtrado;
            const inicio = total === 0 ? 0 : ((data.paginacion.pagina - 1) * data.paginacion.limite) + 1;
            const fin = Math.min(data.paginacion.pagina * data.paginacion.limite, total);

            resumenTexto.textContent = `Mostrando ${inicio} a ${fin} de ${total} máquinas`;
        }

    } catch (error) {
        console.error("Error cargando máquinas:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="7">Error de conexión al cargar máquinas</td>
            </tr>
        `;
    }

    tabla.classList.remove("tabla-cargando-suave");
}

/* =========================
   RENDER TARJETAS RESUMEN
========================= */
function renderResumenEstadosMaquinas(resumen) {
    const operativas = document.getElementById("estadoMaquinasOperativas");
    const noOperativas = document.getElementById("estadoMaquinasNoOperativas");
    const mantencion = document.getElementById("estadoMaquinasMantencion");

    if (operativas) operativas.textContent = resumen.operativas;
    if (noOperativas) noOperativas.textContent = resumen.no_operativas;
    if (mantencion) mantencion.textContent = resumen.mantencion;

    const porcentajeOperativas = document.querySelector(".maquina-operativa small");
    const porcentajeNoOperativas = document.querySelector(".maquina-no-operativa small");
    const porcentajeMantencion = document.querySelector(".maquina-mantencion small");

    if (porcentajeOperativas) {
        porcentajeOperativas.textContent = `${resumen.porcentaje_operativas}% del total`;
    }

    if (porcentajeNoOperativas) {
        porcentajeNoOperativas.textContent = `${resumen.porcentaje_no_operativas}% del total`;
    }

    if (porcentajeMantencion) {
        porcentajeMantencion.textContent = `${resumen.porcentaje_mantencion}% del total`;
    }
}
/* =========================
   RENDER TABLA
========================= */
function renderTablaEstadosMaquinas(maquinas) {
    const tabla = document.getElementById("tablaEstadosMaquinas");

    if (!tabla) return;

    if (!maquinas || maquinas.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7">No se encontraron máquinas</td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = maquinas.map(maquina => {
        const estadoTexto = obtenerTextoEstadoMaquina(maquina.estado);
        const claseEstado = obtenerClaseEstadoMaquina(maquina.estado);

        const disponible = maquina.estado === "Si";

        const disponibilidadTexto = disponible
            ? `<span class="estado-disponible">✓ Disponible</span>`
            : `<span class="estado-bloqueada">🔒 Bloqueada en formulario</span>`;

        const motivo = maquina.observacion && maquina.observacion.trim() !== ""
            ? maquina.observacion
            : "—";

        const actualizadoPor = maquina.actualizado_por || "Admin";
        const fecha = formatearFechaEstadoMaquina(maquina.fecha_actualizacion);

        return `
            <tr>
                <td>${maquina.nombre_maquina}</td>
                <td>${maquina.zona}</td>
                <td>
                    <span class="${claseEstado}">${estadoTexto}</span>
                </td>
                <td>${disponibilidadTexto}</td>
                <td>${motivo}</td>
                <td>
                    ${fecha}<br>
                    <small>${actualizadoPor}</small>
                </td>
                <td>
                    <button 
                        type="button" 
                        class="btn-editar-maquina"
                        onclick="abrirModalEditarMaquina(${maquina.id})">
                        ✎
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

/* =========================
   RENDER PAGINACIÓN
========================= */
function renderPaginacionEstadosMaquinas(paginacion) {
    const contenedor = document.getElementById("paginacionEstadosMaquinas");

    if (!contenedor) return;

    const totalPaginas = paginacion.total_paginas;

    if (totalPaginas <= 1) {
        contenedor.innerHTML = "";
        return;
    }

    let html = "";

    html += `
        <button 
            type="button" 
            ${paginacion.pagina <= 1 ? "disabled" : ""}
            onclick="cambiarPaginaEstadosMaquinas(${paginacion.pagina - 1})">
            ‹
        </button>
    `;

    for (let i = 1; i <= totalPaginas; i++) {
        html += `
            <button 
                type="button" 
                class="${i === paginacion.pagina ? "active" : ""}"
                onclick="cambiarPaginaEstadosMaquinas(${i})">
                ${i}
            </button>
        `;
    }

    html += `
        <button 
            type="button" 
            ${paginacion.pagina >= totalPaginas ? "disabled" : ""}
            onclick="cambiarPaginaEstadosMaquinas(${paginacion.pagina + 1})">
            ›
        </button>
    `;

    contenedor.innerHTML = html;
}

/* =========================
   CAMBIAR PÁGINA
========================= */
function cambiarPaginaEstadosMaquinas(pagina) {
    paginaActualEstadosMaquinas = pagina;
    cargarEstadosMaquinas(pagina);
}

/* =========================
   HELPERS
========================= */
function obtenerTextoEstadoMaquina(estado) {
    if (estado === "Si") return "Operativa";
    if (estado === "No") return "No operativa";
    if (estado === "Mantencion") return "En mantención";
    return "Sin estado";
}

function obtenerClaseEstadoMaquina(estado) {
    if (estado === "Si") return "estado-badge estado-badge-operativa";
    if (estado === "No") return "estado-badge estado-badge-no-operativa";
    if (estado === "Mantencion") return "estado-badge estado-badge-mantencion";
    return "estado-badge";
}

function formatearFechaEstadoMaquina(fechaMysql) {
    if (!fechaMysql) return "—";

    const fecha = new Date(fechaMysql.replace(" ", "T"));

    if (isNaN(fecha.getTime())) {
        return fechaMysql;
    }

    return fecha.toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* =========================
   TEMPORAL
   Luego la haremos funcional
========================= */
function abrirModalEditarMaquina(id) {
    const maquina = maquinasEstadosActuales.find(item => Number(item.id) === Number(id));

    if (!maquina) {
        console.error("No se encontró la máquina con ID:", id);
        alert("No se encontró la máquina seleccionada.");
        return;
    }

    const overlay = document.getElementById("modalMaquinaOverlay");

    const inputId = document.getElementById("modalMaquinaId");
    const inputNombre = document.getElementById("modalMaquinaNombre");
    const inputZona = document.getElementById("modalMaquinaZona");
    const selectEstado = document.getElementById("modalMaquinaEstado");
    const textareaObservacion = document.getElementById("modalMaquinaObservacion");
    const inputActualizadoPor = document.getElementById("modalMaquinaActualizadoPor");

    if (!overlay) {
        console.error("No existe el modalMaquinaOverlay en el HTML.");
        return;
    }

    inputId.value = maquina.id;
    inputNombre.value = maquina.nombre_maquina || "";
    inputZona.value = maquina.zona || "";
    selectEstado.value = maquina.estado || "Si";
    textareaObservacion.value = maquina.observacion || "";
    inputActualizadoPor.value = maquina.actualizado_por || "Admin";

    overlay.style.display = "flex";
}

function cerrarModalEditarMaquina() {
    const overlay = document.getElementById("modalMaquinaOverlay");

    if (overlay) {
        overlay.style.display = "none";
    }
}

async function guardarEstadoMaquina() {
    const id = document.getElementById("modalMaquinaId")?.value;
    const estado = document.getElementById("modalMaquinaEstado")?.value;
    const observacion = document.getElementById("modalMaquinaObservacion")?.value.trim() || "";
    const actualizadoPor = document.getElementById("modalMaquinaActualizadoPor")?.value.trim() || "Admin";

    const btnGuardar = document.getElementById("btnGuardarEstadoMaquina");

    if (!id) {
        alert("No se encontró el ID de la máquina.");
        return;
    }

    if (!estado) {
        alert("Debes seleccionar un estado.");
        return;
    }

    try {
        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.textContent = "Guardando...";
        }

        const response = await fetch("php/maquinas/actualizar_estado_maquina.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                estado: estado,
                observacion: observacion,
                actualizado_por: actualizadoPor
            })
        });

        const data = await response.json();

        if (!data.success) {
            console.error(data);
            alert(data.message || "No se pudo actualizar la máquina.");
            return;
        }

        cerrarModalEditarMaquina();

        await cargarEstadosMaquinas(paginaActualEstadosMaquinas);

    } catch (error) {
        console.error("Error guardando estado de máquina:", error);
        alert("Error de conexión al guardar el estado de la máquina.");

    } finally {
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar cambios";
        }
    }
}