/* =========================
   CARGAR FLUJO SELECCIONADO
========================= */
function cargarFlujoSeleccionado() {
    const producto = obtenerProductoSeleccionadoDesdeFormularioFlujo();

    if (!producto) {
        alert("Selecciona un producto válido para cargar su flujo");
        return;
    }

    flujoProductoSeleccionado = clonarEstadoFlujo(producto);
    flujoCantidadOperacionesVisibles = 1;
    flujoCardsVaciasAbajo = {};
    flujoHistorialEstados = [];

    renderizarFlujoProducto(flujoProductoSeleccionado);
    renderizarTablaDetalleFlujo(flujoProductoSeleccionado);
    renderizarResumenFlujo(flujoProductoSeleccionado);
}

/* =========================
   AVANZAR FLUJO PROCESO
========================= */
function avanzarFlujoProceso(direccion = "right") {
    if (!flujoProductoSeleccionado) return;

    const operaciones = obtenerOperacionesOrdenadas(flujoProductoSeleccionado);

    if (flujoCantidadOperacionesVisibles >= operaciones.length) {
        return;
    }

    guardarEstadoHistorialFlujoProceso();

    console.log("Avanzar flujo hacia:", direccion);

    flujoCantidadOperacionesVisibles++;

    renderizarFlujoProducto(flujoProductoSeleccionado);
    renderizarTablaDetalleFlujo(flujoProductoSeleccionado);
    renderizarResumenFlujo(flujoProductoSeleccionado);
}

/* =========================
   CREAR CARD VACÍA ABAJO
========================= */
function crearCardVaciaAbajo(indexBase) {
    if (!flujoProductoSeleccionado) return;

    const operaciones = obtenerOperacionesOrdenadas(flujoProductoSeleccionado);
    const siguienteReal = operaciones[indexBase + 1] || null;

    if (!siguienteReal) {
        return;
    }

    guardarEstadoHistorialFlujoProceso();

    if (!Array.isArray(flujoCardsVaciasAbajo[indexBase])) {
        flujoCardsVaciasAbajo[indexBase] = [];
    }

    flujoCardsVaciasAbajo[indexBase].push({
        idTemporal: `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        editada: false,
        nombre: "",
        horas: "00",
        minutos: "00",
        descripcion: "",
        tipo: "normal"
    });

    renderizarFlujoProducto(flujoProductoSeleccionado);
    renderizarTablaDetalleFlujo(flujoProductoSeleccionado);
    renderizarResumenFlujo(flujoProductoSeleccionado);
}

/* =========================
   AVANZAR DESDE CARD VACÍA
========================= */
function avanzarDesdeCardVacia(indexBase, direccion = "right") {
    if (!flujoProductoSeleccionado) return;

    if (direccion === "down") {
        crearCardVaciaAbajo(indexBase);
        return;
    }

    if (direccion === "right") {
        avanzarFlujoProceso("right");
    }
}
