/* =========================
   MODAL EDITAR OPERACIÓN
========================= */
function configurarEventosModalFlujo() {
    const btnCerrar = document.getElementById("btnCerrarModalFlujo");
    const btnCancelar = document.getElementById("btnCancelarModalFlujo");
    const btnGuardar = document.getElementById("btnGuardarModalFlujo");
    const modal = document.getElementById("modalEditarOperacionFlujo");

    if (btnCerrar) {
        btnCerrar.onclick = cerrarModalEditarOperacionFlujo;
    }

    if (btnCancelar) {
        btnCancelar.onclick = cerrarModalEditarOperacionFlujo;
    }

    if (btnGuardar) {
        btnGuardar.onclick = guardarEdicionOperacionFlujo;
    }

    if (modal) {
        modal.onclick = e => {
            if (e.target === modal) {
                cerrarModalEditarOperacionFlujo();
            }
        };
    }
}

function abrirModalEditarOperacionRealFlujo(indexOperacion) {
    if (!flujoProductoSeleccionado) return;

    const operaciones = obtenerOperacionesOrdenadas(flujoProductoSeleccionado);
    const operacion = operaciones[indexOperacion];

    if (!operacion) return;

    flujoEdicionActual = {
        tipo: "real",
        indexOperacion
    };

    const esCC = esOperacionControlCalidad(operacion);

    const nombre = esCC
        ? "Control de calidad"
        : operacion.maquina || "";

    cargarDatosFormularioModalFlujo({
        nombre,
        horas: operacion.horas || "00",
        minutos: operacion.minutos || "00",
        descripcion: operacion.descripcion || operacion.observaciones || "",
        tipo: esCC ? "control_calidad" : (operacion.tipo || "normal")
    });

    abrirModalEditarOperacionFlujo();
}

function abrirModalEditarOperacionTemporalFlujo(indexBase, posicionVacia) {
    const cardsTemporales = flujoCardsVaciasAbajo[indexBase];

    if (!Array.isArray(cardsTemporales)) return;

    const cardTemporal = cardsTemporales[posicionVacia - 1];

    if (!cardTemporal) return;

    flujoEdicionActual = {
        tipo: "temporal",
        indexBase,
        posicionVacia
    };

    cargarDatosFormularioModalFlujo({
        nombre: cardTemporal.nombre || "",
        horas: cardTemporal.horas || "00",
        minutos: cardTemporal.minutos || "00",
        descripcion: cardTemporal.descripcion || "",
        tipo: cardTemporal.tipo || "normal"
    });

    abrirModalEditarOperacionFlujo();
}

function abrirModalEditarOperacionFlujo() {
    const modal = document.getElementById("modalEditarOperacionFlujo");

    if (!modal) {
        console.warn("No existe #modalEditarOperacionFlujo en el HTML");
        return;
    }

    modal.classList.remove("oculto");

    setTimeout(() => {
        const inputNombre = document.getElementById("inputNombreOperacionFlujo");
        if (inputNombre) inputNombre.focus();
    }, 50);
}

function cerrarModalEditarOperacionFlujo() {
    const modal = document.getElementById("modalEditarOperacionFlujo");

    if (modal) {
        modal.classList.add("oculto");
    }

    flujoEdicionActual = null;
}

function cargarDatosFormularioModalFlujo(datos) {
    const inputNombre = document.getElementById("inputNombreOperacionFlujo");
    const selectHoras = document.getElementById("selectHorasOperacionFlujo");
    const selectMinutos = document.getElementById("selectMinutosOperacionFlujo");
    const textareaDescripcion = document.getElementById("textareaDescripcionOperacionFlujo");
    const selectTipo = document.getElementById("selectTipoOperacionFlujo");

    if (inputNombre) {
        inputNombre.value = datos.nombre || "";
    }

    if (selectHoras) {
        asignarValorSelectFlujo(selectHoras, String(parseInt(datos.horas) || 0).padStart(2, "0"));
    }

    if (selectMinutos) {
        asignarValorSelectFlujo(selectMinutos, String(parseInt(datos.minutos) || 0).padStart(2, "0"));
    }

    if (textareaDescripcion) {
        textareaDescripcion.value = datos.descripcion || "";
    }

    if (selectTipo) {
        asignarValorSelectFlujo(selectTipo, datos.tipo || "normal");
    }
}

function guardarEdicionOperacionFlujo() {
    if (!flujoProductoSeleccionado || !flujoEdicionActual) return;

    const inputNombre = document.getElementById("inputNombreOperacionFlujo");
    const selectHoras = document.getElementById("selectHorasOperacionFlujo");
    const selectMinutos = document.getElementById("selectMinutosOperacionFlujo");
    const textareaDescripcion = document.getElementById("textareaDescripcionOperacionFlujo");
    const selectTipo = document.getElementById("selectTipoOperacionFlujo");

    const nombre = inputNombre?.value.trim() || "";
    const horas = selectHoras?.value || "00";
    const minutos = selectMinutos?.value || "00";
    const descripcion = textareaDescripcion?.value.trim() || "";
    const tipo = selectTipo?.value || "normal";

    if (!nombre) {
        alert("Ingresa el nombre de la operación");
        return;
    }

    guardarEstadoHistorialFlujoProceso();

    if (flujoEdicionActual.tipo === "real") {
        const operaciones = obtenerOperacionesOrdenadas(flujoProductoSeleccionado);
        const operacion = operaciones[flujoEdicionActual.indexOperacion];

        if (!operacion) return;

        operacion.maquina = nombre;
        operacion.horas = parseInt(horas) || 0;
        operacion.minutos = parseInt(minutos) || 0;
        operacion.descripcion = descripcion;
        operacion.tipo = tipo;
        operacion._editadaFlujo = true;
    }

    if (flujoEdicionActual.tipo === "temporal") {
        const cardsTemporales = flujoCardsVaciasAbajo[flujoEdicionActual.indexBase];

        if (!Array.isArray(cardsTemporales)) return;

        const cardTemporal = cardsTemporales[flujoEdicionActual.posicionVacia - 1];

        if (!cardTemporal) return;

        cardTemporal.editada = true;
        cardTemporal.nombre = nombre;
        cardTemporal.horas = parseInt(horas) || 0;
        cardTemporal.minutos = parseInt(minutos) || 0;
        cardTemporal.descripcion = descripcion;
        cardTemporal.tipo = tipo;
    }

    cerrarModalEditarOperacionFlujo();

    renderizarFlujoProducto(flujoProductoSeleccionado);
    renderizarTablaDetalleFlujo(flujoProductoSeleccionado);
    renderizarResumenFlujo(flujoProductoSeleccionado);
}

function asignarValorSelectFlujo(select, valor) {
    if (!select) return;

    const existe = Array.from(select.options).some(option => option.value === valor);

    if (!existe) {
        const option = document.createElement("option");
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
    }

    select.value = valor;
}
