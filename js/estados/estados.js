/* =========================
   ESTADOS - IRONIX
   Producción / Máquinas + Cards BD + Tabla Producción
========================= */

let estadosProduccionData = [];

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
                <span class="badge ${obtenerClaseBadgeEstado(estado)}">
                    ${formatearTextoEstado(estado)}
                </span>
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

    const btnAyudaEstados = e.target.closest("#btnAyudaEstados");

    if (btnAyudaEstados) {
        const boxAyuda = document.getElementById("boxAyudaEstados");

        if (boxAyuda) {
            boxAyuda.classList.toggle("active");
        }

        return;
    }

});

document.addEventListener("click", function (e) {
    const ayudaWrap = e.target.closest(".estado-ayuda-wrap");
    const boxAyuda = document.getElementById("boxAyudaEstados");

    if (!ayudaWrap && boxAyuda) {
        boxAyuda.classList.remove("active");
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