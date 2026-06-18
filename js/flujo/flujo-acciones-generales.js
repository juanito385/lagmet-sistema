/* =========================
   ACCIONES GENERALES FLUJO
========================= */

/* =========================
   GUARD EDICIÓN FLUJO - FASE 5
========================= */
function validarPermisoEditarFlujoIronix(accion = "modificar Flujo Proceso") {
    /*
        Guardia frontend:
        bloquea acciones que modifican el flujo si el usuario
        solo tiene permiso de visualización.
    */

    if (typeof usuarioPuedeAccionIronix !== "function") {
        console.warn("No existe usuarioPuedeAccionIronix para validar edición de flujo");

        alert("No se pudo validar el permiso de edición");
        return false;
    }

    if (
        !usuarioPuedeAccionIronix("flujo-proceso", "editar") &&
        !usuarioPuedeAccionIronix("flujo-proceso", "guardar")
    ) {
        alert(`No tienes permisos para ${accion}`);
        return false;
    }

    return true;
}

function limpiarFlujoProceso() {
    flujoProductoSeleccionado = null;
    flujoCantidadOperacionesVisibles = 1;
    flujoCardsVaciasAbajo = {};
    flujoHistorialEstados = [];
    flujoEdicionActual = null;

    const inputBuscar = document.getElementById("inputBuscarProductoFlujo");
    const inputSeleccionado = document.getElementById("inputProductoSeleccionadoFlujo");
    const inputOrden = document.getElementById("inputOrdenTrabajoFlujo");
    const inputOt = document.getElementById("inputOtFlujo");

    if (inputBuscar) inputBuscar.value = "";
    if (inputSeleccionado) inputSeleccionado.value = "";
    if (inputOrden) inputOrden.value = "";
    if (inputOt) inputOt.value = "";

    ocultarListaProductosFlujo();
    cerrarPanelOpcionesFlujo();
    renderizarEstadoInicialFlujoProceso();
}

function renderizarEstadoInicialFlujoProceso() {
    const board = document.getElementById("flujoBoard");
    const tabla = document.getElementById("tablaDetalleFlujo");

    if (board) {
        board.innerHTML = `
            <div class="flujo-empty-state" id="flujoEmptyState">
                <span class="material-symbols-outlined">account_tree</span>
                <h3>Selecciona un producto para visualizar su flujo</h3>
                <p>El sistema cargará la ruta de fabricación usando el orden de trabajo y la OT proporcionados.</p>
            </div>
        `;
    }

    if (tabla) {
        tabla.innerHTML = `
            <tr>
                <td colspan="9" class="flujo-table-empty">
                    Sin operaciones cargadas
                </td>
            </tr>
        `;
    }

    const resumenTotalProductos = document.getElementById("resumenTotalProductos");
    const resumenTotalOperaciones = document.getElementById("resumenTotalOperaciones");
    const resumenTiempoEstimado = document.getElementById("resumenTiempoEstimado");
    const resumenControlCalidad = document.getElementById("resumenControlCalidad");
    const resumenProgreso = document.getElementById("resumenProgreso");
    const barraProgreso = document.getElementById("barraProgresoFlujo");

    if (resumenTotalProductos) resumenTotalProductos.textContent = "0";
    if (resumenTotalOperaciones) resumenTotalOperaciones.textContent = "0";
    if (resumenTiempoEstimado) resumenTiempoEstimado.textContent = "00:00";
    if (resumenControlCalidad) resumenControlCalidad.textContent = "Habilitado";
    if (resumenProgreso) resumenProgreso.textContent = "0%";
    if (barraProgreso) barraProgreso.style.width = "0%";
}

function restablecerFlujoProceso() {
    if (!validarPermisoEditarFlujoIronix("restablecer Flujo Proceso")) {
        return;
    }

    if (!flujoProductoSeleccionado) {
        alert("No hay un flujo cargado para restablecer");
        return;
    }

    const idActual = flujoProductoSeleccionado.id;

    const productoOriginal = flujoProductosOriginalesBD.find(producto => {
        return String(producto.id) === String(idActual);
    });

    if (!productoOriginal) {
        alert("No se encontró el estado original del flujo");
        return;
    }

    flujoProductoSeleccionado = clonarEstadoFlujo(productoOriginal);
    flujoCantidadOperacionesVisibles = 1;
    flujoCardsVaciasAbajo = {};
    flujoHistorialEstados = [];

    cerrarPanelOpcionesFlujo();

    renderizarFlujoProducto(flujoProductoSeleccionado);
    renderizarTablaDetalleFlujo(flujoProductoSeleccionado);
    renderizarResumenFlujo(flujoProductoSeleccionado);
}

function guardarEstadoHistorialFlujoProceso() {
    if (!flujoProductoSeleccionado) return;

    flujoHistorialEstados.push({
        producto: clonarEstadoFlujo(flujoProductoSeleccionado),
        cantidadOperacionesVisibles: flujoCantidadOperacionesVisibles,
        cardsVaciasAbajo: clonarEstadoFlujo(flujoCardsVaciasAbajo)
    });

    if (flujoHistorialEstados.length > 30) {
        flujoHistorialEstados.shift();
    }
}

function deshacerUltimoCambioFlujo() {
    if (!validarPermisoEditarFlujoIronix("deshacer cambios en Flujo Proceso")) {
        return;
    }

    if (flujoHistorialEstados.length === 0) {
        alert("No hay cambios para deshacer");
        return;
    }

    const estadoAnterior = flujoHistorialEstados.pop();

    flujoProductoSeleccionado = clonarEstadoFlujo(estadoAnterior.producto);
    flujoCantidadOperacionesVisibles = estadoAnterior.cantidadOperacionesVisibles;
    flujoCardsVaciasAbajo = clonarEstadoFlujo(estadoAnterior.cardsVaciasAbajo || {});

    cerrarModalEditarOperacionFlujo();
    cerrarPanelOpcionesFlujo();

    renderizarFlujoProducto(flujoProductoSeleccionado);
    renderizarTablaDetalleFlujo(flujoProductoSeleccionado);
    renderizarResumenFlujo(flujoProductoSeleccionado);
}

function alternarPanelOpcionesFlujo() {
    const panel = document.getElementById("panelOpcionesFlujo");

    if (!panel) return;

    panel.classList.toggle("oculto");
}

function cerrarPanelOpcionesFlujo() {
    const panel = document.getElementById("panelOpcionesFlujo");

    if (panel) {
        panel.classList.add("oculto");
    }
}

function exportarImagenFlujo() {
    if (
        window.flujoProcesoExport &&
        typeof window.flujoProcesoExport.exportarImagen === "function"
    ) {
        window.flujoProcesoExport.exportarImagen();
        return;
    }

    alert("El módulo de exportación del flujo no está cargado.");
}

function exportarPdfFlujo() {
    if (
        window.flujoProcesoExport &&
        typeof window.flujoProcesoExport.exportarPdf === "function"
    ) {
        window.flujoProcesoExport.exportarPdf();
        return;
    }

    alert("El módulo de exportación del flujo no está cargado.");
}

function clonarEstadoFlujo(valor) {
    return JSON.parse(JSON.stringify(valor));
}
