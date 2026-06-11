/* =========================
   OBTENER OPERACIONES ORDENADAS
   Regla crítica:
   - Las máquinas reales siempre van primero.
   - Control de Calidad siempre queda al final.
========================= */
function obtenerOperacionesOrdenadas(producto) {
    const operaciones = [...(producto?.operaciones || [])];

    operaciones.sort((a, b) => {
        const aEsCC = esOperacionControlCalidad(a);
        const bEsCC = esOperacionControlCalidad(b);

        if (aEsCC && !bEsCC) return 1;
        if (!aEsCC && bEsCC) return -1;

        const ordenA = obtenerOrdenSeguro(a);
        const ordenB = obtenerOrdenSeguro(b);

        if (ordenA !== ordenB) {
            return ordenA - ordenB;
        }

        const idA = a.id !== null && a.id !== undefined ? Number(a.id) : 999999;
        const idB = b.id !== null && b.id !== undefined ? Number(b.id) : 999999;

        return idA - idB;
    });

    return operaciones;
}

/* =========================
   DETECTAR CONTROL DE CALIDAD
========================= */
function esOperacionControlCalidad(operacion) {
    if (!operacion) return false;

    const tipo = String(operacion.tipo || "").toLowerCase().trim();
    const maquina = String(operacion.maquina || "").toLowerCase().trim();
    const zona = String(operacion.zona || "").toLowerCase().trim();

    return (
        tipo === "control_calidad" ||
        zona === "control_calidad" ||
        maquina === "cc" ||
        maquina.includes("control de calidad")
    );
}

/* =========================
   ORDEN SEGURO
========================= */
function obtenerOrdenSeguro(operacion) {
    const orden = Number(operacion?.orden);

    if (!Number.isFinite(orden) || orden <= 0) {
        return 999999;
    }

    return orden;
}

/* =========================
   OBTENER OPERACIONES VISIBLES
========================= */
function obtenerOperacionesVisibles(producto) {
    const operaciones = obtenerOperacionesOrdenadas(producto);
    return operaciones.slice(0, flujoCantidadOperacionesVisibles);
}

/* =========================
   OBTENER COLUMNAS
========================= */
function obtenerColumnasFlujo(operaciones) {
    const columnas = [];

    operaciones.forEach(op => {
        const nombreColumna = obtenerNombreColumnaOperacion(op);

        if (!columnas.includes(nombreColumna)) {
            columnas.push(nombreColumna);
        }
    });

    return columnas;
}

/* =========================
   NOMBRE COLUMNA
========================= */
function obtenerNombreColumnaOperacion(operacion) {
    if (esOperacionControlCalidad(operacion)) {
        return "Control de Calidad (CC)";
    }

    return operacion.maquina || "Sin máquina";
}

/* =========================
   CREAR TARJETA
========================= */
function crearTarjetaOperacion(operacion, index, tipoConector = "none", haySiguienteOculto = false) {
    const esCC = esOperacionControlCalidad(operacion);
    const numeroVisual = obtenerNumeroVisualOperacionReal(index);

    /*
        Regla visual:
        - Si la operación todavía no fue editada en Flujo Proceso,
          se muestra como placeholder.
        - Cuando se guarda desde el modal, debe quedar:
          operacion._editadaFlujo = true;
    */
    const operacionEditada = operacion._editadaFlujo === true;

    let accionHTML = "";

    if (haySiguienteOculto) {
        accionHTML = `
            <button 
                class="flujo-grid-plus flujo-plus-right" 
                data-origen="operacion"
                data-direccion="right"
                data-index-base="${index}"
                title="Mostrar siguiente operación a la derecha">
                +
            </button>

            <button 
                class="flujo-grid-plus flujo-plus-down" 
                data-origen="operacion"
                data-direccion="down"
                data-index-base="${index}"
                title="Crear operación debajo">
                +
            </button>
        `;
    } else if (tipoConector === "none") {
        accionHTML = `
            <span class="flujo-grid-check">
                ✓
            </span>
        `;
    }

    /* =========================
       OPERACIÓN SIN EDITAR
       Se muestra como card vacía
    ========================= */
    if (!operacionEditada) {
        return `
            <div 
                class="flujo-grid-card-wrapper conector-${tipoConector}"
                data-operacion-index="${index}">

                <div 
                    class="flujo-grid-card flujo-grid-card-vacia flujo-grid-card-real-pendiente"
                    data-tipo-card="real"
                    data-operacion-index="${index}"
                    title="Editar operación">

                    <div class="flujo-grid-card-vacia-icon">
                        +
                    </div>

                    <div class="flujo-grid-card-info">
                        <strong>Nueva operación</strong>
                        <span>Vacía</span>
                    </div>

                    ${accionHTML}

                </div>
            </div>
        `;
    }

    /* =========================
       OPERACIÓN EDITADA
       Se muestra como card normal
    ========================= */
    const titulo = esCC
        ? "Control de calidad"
        : operacion.maquina;

    const duracion = esCC
        ? "Cierre final"
        : formatearDuracion(operacion.horas, operacion.minutos);

    return `
        <div 
            class="flujo-grid-card-wrapper conector-${tipoConector}"
            data-operacion-index="${index}">

            <div 
                class="flujo-grid-card ${esCC ? "flujo-grid-card-cc" : ""}"
                data-tipo-card="real"
                data-operacion-index="${index}"
                title="Editar operación">

                <div class="flujo-grid-card-numero">
                    ${numeroVisual}
                </div>

                <div class="flujo-grid-card-info">
                    <strong>${numeroVisual}. ${escaparHTML(titulo)}</strong>
                    <span>${escaparHTML(duracion)}</span>
                </div>

                ${accionHTML}

            </div>
        </div>
    `;
}
