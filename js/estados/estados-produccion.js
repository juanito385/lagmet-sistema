/* =========================
   ESTADOS PRODUCCIÓN
   Cards, tabla, filtros, paginación y cambio rápido de estado
========================= */

/* =========================
   ESTADO LOCAL DE PRODUCCIÓN
========================= */
let estadosProduccionVista = [];

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

        if (pendiente) pendiente.textContent = data.cards?.pendiente ?? 0;
        if (proceso) proceso.textContent = data.cards?.en_proceso ?? 0;
        if (pausado) pausado.textContent = data.cards?.pausado ?? 0;
        if (terminado) terminado.textContent = data.cards?.terminado ?? 0;
        if (entregado) entregado.textContent = data.cards?.entregado ?? 0;
        if (atrasado) atrasado.textContent = data.cards?.atrasado ?? 0;

        estadosProduccionData = Array.isArray(data.data) ? data.data : [];

        if (!Number.isFinite(paginaActualEstadosProduccion)) {
            paginaActualEstadosProduccion = 1;
        }

        renderTablaEstadosProduccion(estadosProduccionData);

    } catch (error) {
        console.error("Error cargando estados de producción:", error);
    }
}

/* =========================
   HELPERS INTERNOS PRODUCCIÓN
========================= */
function normalizarEstadoProduccion(estado) {
    return String(estado || "pendiente").trim().toLowerCase();
}

function normalizarValorBooleanoEstado(valor) {
    return valor === true ||
           valor === 1 ||
           valor === "1" ||
           String(valor).toLowerCase() === "true" ||
           String(valor).toLowerCase() === "si" ||
           String(valor).toLowerCase() === "sí";
}

function extraerFechaBaseEstado(fecha) {
    if (!fecha) return "";

    return String(fecha).split(" ")[0].trim();
}

function convertirFechaEstadoADate(fecha) {
    const fechaBase = extraerFechaBaseEstado(fecha);

    if (!fechaBase) return null;

    const partes = fechaBase.split("-");

    if (partes.length !== 3) return null;

    const anio = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const dia = Number(partes[2]);

    const fechaDate = new Date(anio, mes, dia);

    if (isNaN(fechaDate.getTime())) return null;

    return fechaDate;
}

function fechaEstadoMayorQue(fechaA, fechaB) {
    const a = convertirFechaEstadoADate(fechaA);
    const b = convertirFechaEstadoADate(fechaB);

    if (!a || !b) return false;

    return a.getTime() > b.getTime();
}

function obtenerFechaRealTerminoEstado(item) {
    return item.fecha_fin_real ||
           item.fecha_termino_real ||
           item.fecha_terminado ||
           item.fecha_entregado ||
           item.fecha_estado ||
           item.fecha_actualizacion_estado ||
           item.fecha_actualizacion ||
           item.updated_at ||
           "";
}

function debeMostrarAlertaAtraso(item) {
    const estado = normalizarEstadoProduccion(item.estado_actual);
    const fechaEstimada = item.fecha_fin_estimada || item.fecha_fin || "";
    const fechaRealTermino = obtenerFechaRealTerminoEstado(item);
    const tieneAtrasoBackend = normalizarValorBooleanoEstado(item.esta_atrasado);

    const esEstadoFinal = estado === "terminado" || estado === "entregado";

    /*
       Regla final:
       - Si está Terminado/Entregado y existe fecha real, la alerta aparece
         solo si esa fecha real fue posterior a la fecha estimada.
       - Si no viene fecha real desde PHP, se respeta el indicador esta_atrasado
         para no perder la alerta existente.
       - Si no está finalizado, se usa esta_atrasado.
    */
    if (esEstadoFinal) {
        if (fechaRealTermino) {
            return fechaEstadoMayorQue(fechaRealTermino, fechaEstimada);
        }

        return tieneAtrasoBackend;
    }

    return tieneAtrasoBackend;
}

function obtenerTotalPaginasEstadosProduccion(totalRegistros) {
    return Math.max(
        1,
        Math.ceil(totalRegistros / limiteEstadosProduccion)
    );
}

/* =========================
   RENDER TABLA PRODUCCIÓN
========================= */
function renderTablaEstadosProduccion(registros) {
    const tbody = document.getElementById("tablaEstadosProduccion");
    const resumen = document.getElementById("resumenEstadosProduccion");

    if (!tbody) return;

    estadosProduccionVista = Array.isArray(registros) ? registros : [];

    const totalRegistros = estadosProduccionVista.length;
    const totalPaginas = obtenerTotalPaginasEstadosProduccion(totalRegistros);

    if (paginaActualEstadosProduccion > totalPaginas) {
        paginaActualEstadosProduccion = totalPaginas;
    }

    if (paginaActualEstadosProduccion < 1) {
        paginaActualEstadosProduccion = 1;
    }

    const inicio = (paginaActualEstadosProduccion - 1) * limiteEstadosProduccion;
    const fin = inicio + limiteEstadosProduccion;
    const registrosPagina = estadosProduccionVista.slice(inicio, fin);

    tbody.innerHTML = "";

    if (totalRegistros === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">No hay registros de producción disponibles.</td>
            </tr>
        `;

        if (resumen) {
            resumen.textContent = "Mostrando 0 a 0 de 0 productos";
        }

        renderPaginacionEstadosProduccion(totalRegistros);
        return;
    }

    registrosPagina.forEach(item => {
        const estado = normalizarEstadoProduccion(item.estado_actual);
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
        const desde = inicio + 1;
        const hasta = Math.min(fin, totalRegistros);

        resumen.textContent = `Mostrando ${desde} a ${hasta} de ${totalRegistros} productos`;
    }

    renderPaginacionEstadosProduccion(totalRegistros);
}

/* =========================
   PAGINACIÓN PRODUCCIÓN
========================= */
function renderPaginacionEstadosProduccion(totalRegistros) {
    const contenedor = document.getElementById("paginacionEstadosProduccion");

    if (!contenedor) return;

    const totalPaginas = obtenerTotalPaginasEstadosProduccion(totalRegistros);

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
            ${paginaActualEstadosProduccion <= 1 ? "disabled" : ""}
            aria-label="Página anterior">
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
            ${paginaActualEstadosProduccion >= totalPaginas ? "disabled" : ""}
            aria-label="Página siguiente">
            ›
        </button>
    `;

    contenedor.innerHTML = html;
}

function cambiarPaginaEstadosProduccion(pagina) {
    const totalPaginas = obtenerTotalPaginasEstadosProduccion(estadosProduccionVista.length);
    const nuevaPagina = Number(pagina);

    if (!Number.isFinite(nuevaPagina)) return;
    if (nuevaPagina < 1) return;
    if (nuevaPagina > totalPaginas) return;
    if (nuevaPagina === paginaActualEstadosProduccion) return;

    paginaActualEstadosProduccion = nuevaPagina;
    renderTablaEstadosProduccion(estadosProduccionVista);
}

/* =========================
   EVENTO PAGINACIÓN PRODUCCIÓN
========================= */
if (!window.__paginacionEstadosProduccionInicializada) {
    window.__paginacionEstadosProduccionInicializada = true;

    document.addEventListener("click", function (e) {
        const btnPaginaProduccion = e.target.closest("#paginacionEstadosProduccion .btn-pagina-estado");

        if (!btnPaginaProduccion) return;
        if (btnPaginaProduccion.disabled) return;

        cambiarPaginaEstadosProduccion(btnPaginaProduccion.dataset.pagina);
    });
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
                return debeMostrarAlertaAtraso(item);
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

function bloquearAccionesEstado(bloquear = true) {
    const botones = document.querySelectorAll(
        "#modalEstadoOverlay .btn-accion-estado, #modalEstadoOverlay .estado-acciones button"
    );

    botones.forEach(boton => {
        boton.disabled = bloquear;
        boton.classList.toggle("guardando", bloquear);
    });
}

function mostrarEstadoGuardandoAccion(mostrar = true) {
    const accionesCard = document.querySelector("#modalEstadoOverlay .estado-acciones");

    if (!accionesCard) return;

    accionesCard.classList.toggle("estado-guardando", mostrar);
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

                /*
        Actualización localizada:
        no recargamos toda la tabla/cards mientras el modal está abierto,
        para evitar parpadeos o vibración visual.
        */
        estadoProduccionSeleccionada.estado_actual = nuevoEstado;
        estadoProduccionSeleccionada.fecha_fin_real = data.fecha_fin_real || estadoProduccionSeleccionada.fecha_fin_real;

        const index = estadosProduccionData.findIndex(
            item => String(item.id) === String(produccionId)
        );

        if (index !== -1) {
            estadosProduccionData[index] = {
                ...estadosProduccionData[index],
                estado_actual: nuevoEstado,
                fecha_fin_real: data.fecha_fin_real || estadosProduccionData[index].fecha_fin_real
            };
        }

        cargarDetalleEstadoProduccion(estadoProduccionSeleccionada);
        await cargarHistorialEstadoProduccion(produccionId, false);

        estadosProduccionNecesitaRefresco = true;

    } catch (error) {
        console.error("Error cambiando estado:", error);
        alert("Error de conexión al cambiar el estado.");
    }
}