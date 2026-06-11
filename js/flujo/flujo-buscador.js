/* =========================
   CARGAR BUSCADOR PRODUCTOS
========================= */
function cargarSelectoresFlujoProceso() {
    renderizarListaProductosFlujo("");
}

/* =========================
   BUSCADOR PRODUCTOS FLUJO
========================= */
function renderizarListaProductosFlujo(filtro = "") {
    const lista = document.getElementById("listaProductosFlujo");

    if (!lista) return;

    const textoFiltro = normalizarTextoFlujo(filtro);

    const productosFiltrados = flujoProductosBD
        .filter(producto => {
            const textoProducto = normalizarTextoFlujo(producto.producto || "");
            const textoPedido = normalizarTextoFlujo(producto.numero_pedido || "");

            if (!textoFiltro) return true;

            return textoProducto.includes(textoFiltro) || textoPedido.includes(textoFiltro);
        })
        .slice(0, 20);

    if (productosFiltrados.length === 0) {
        lista.innerHTML = `
            <div class="flujo-producto-item">
                <strong>Sin resultados</strong>
                <span>No se encontraron productos coincidentes</span>
            </div>
        `;
        return;
    }

    lista.innerHTML = productosFiltrados.map(producto => {
        const datosOt = separarOrdenTrabajoOtFlujo(producto.numero_pedido);

        return `
            <button 
                type="button" 
                class="flujo-producto-item" 
                data-id="${escaparHTML(producto.id)}">

                <strong>${escaparHTML(producto.producto || "Sin nombre")}</strong>
                <span>Orden ${escaparHTML(datosOt.ordenTrabajo || "-")} · OT ${escaparHTML(datosOt.ot || "-")}</span>

            </button>
        `;
    }).join("");
}

function mostrarListaProductosFlujo() {
    const lista = document.getElementById("listaProductosFlujo");

    if (lista) {
        lista.classList.remove("oculto");
    }
}

function ocultarListaProductosFlujo() {
    const lista = document.getElementById("listaProductosFlujo");

    if (lista) {
        lista.classList.add("oculto");
    }
}

function seleccionarProductoDesdeListaFlujo(idProducto) {
    const producto = flujoProductosBD.find(p => String(p.id) === String(idProducto));

    if (!producto) return;

    const inputBuscar = document.getElementById("inputBuscarProductoFlujo");
    const inputSeleccionado = document.getElementById("inputProductoSeleccionadoFlujo");
    const inputOrden = document.getElementById("inputOrdenTrabajoFlujo");
    const inputOt = document.getElementById("inputOtFlujo");

    const datosOt = separarOrdenTrabajoOtFlujo(producto.numero_pedido);

    if (inputBuscar) {
        inputBuscar.value = producto.producto || "";
    }

    if (inputSeleccionado) {
        inputSeleccionado.value = producto.id;
    }

    if (inputOrden) {
        inputOrden.value = datosOt.ordenTrabajo || "";
    }

    if (inputOt) {
        inputOt.value = datosOt.ot || "";
    }

    ocultarListaProductosFlujo();
}

function limpiarProductoSeleccionadoFlujo() {
    const inputBuscar = document.getElementById("inputBuscarProductoFlujo");
    const inputSeleccionado = document.getElementById("inputProductoSeleccionadoFlujo");

    if (inputBuscar) inputBuscar.value = "";
    if (inputSeleccionado) inputSeleccionado.value = "";

    renderizarListaProductosFlujo("");
    ocultarListaProductosFlujo();
}

function obtenerProductoSeleccionadoDesdeFormularioFlujo() {
    const inputBuscar = document.getElementById("inputBuscarProductoFlujo");
    const inputSeleccionado = document.getElementById("inputProductoSeleccionadoFlujo");
    const inputOrden = document.getElementById("inputOrdenTrabajoFlujo");
    const inputOt = document.getElementById("inputOtFlujo");

    const idSeleccionado = inputSeleccionado?.value || "";
    const textoProducto = normalizarTextoFlujo(inputBuscar?.value || "");
    const ordenTrabajo = String(inputOrden?.value || "").trim();
    const ot = normalizarOtFlujo(inputOt?.value || "");

    let candidatos = flujoProductosBD;

    if (idSeleccionado) {
        candidatos = candidatos.filter(producto => String(producto.id) === String(idSeleccionado));
    }

    if (textoProducto) {
        candidatos = candidatos.filter(producto => {
            const nombreProducto = normalizarTextoFlujo(producto.producto || "");
            return nombreProducto.includes(textoProducto);
        });
    }

    if (ordenTrabajo || ot) {
        candidatos = candidatos.filter(producto => {
            const datosOt = separarOrdenTrabajoOtFlujo(producto.numero_pedido);

            const coincideOrden = ordenTrabajo
                ? String(datosOt.ordenTrabajo) === String(ordenTrabajo)
                : true;

            const coincideOt = ot
                ? String(datosOt.ot) === String(ot)
                : true;

            return coincideOrden && coincideOt;
        });
    }

    return candidatos[0] || null;
}

function separarOrdenTrabajoOtFlujo(numeroPedido) {
    const limpio = String(numeroPedido || "").trim();

    if (!limpio) {
        return {
            ordenTrabajo: "",
            ot: ""
        };
    }

    const partes = limpio.split("-");

    const ordenTrabajo = String(partes[0] || "").trim();
    const ot = normalizarOtFlujo(partes[1] || "");

    return {
        ordenTrabajo,
        ot
    };
}

function normalizarOtFlujo(valor) {
    const limpio = String(valor || "").trim();

    if (!limpio) return "";

    if (/^\d+$/.test(limpio)) {
        return limpio.padStart(2, "0");
    }

    return limpio;
}

function normalizarTextoFlujo(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}
