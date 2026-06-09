console.log("ARCHIVO flujo-proceso.js CARGADO CORRECTAMENTE");

/* =========================
   FLUJO PROCESO
   Render dinámico con avance progresivo
========================= */

let flujoProductosBD = [];
let flujoProductoSeleccionado = null;
let flujoCantidadOperacionesVisibles = 1;

/*
    Cards temporales creadas manualmente.
    Clave: índice de la operación base.
    Valor: array de cards temporales.
*/
let flujoCardsVaciasAbajo = {};

let flujoEdicionActual = null;

/* =========================
   INICIAR FLUJO PROCESO
========================= */
async function iniciarFlujoProceso() {
    console.log("Iniciando Flujo Proceso...");

    await cargarDatosFlujoProceso();
    cargarSelectoresFlujoProceso();
    configurarEventosFlujoProceso();

    console.log("Flujo Proceso listo");
}

/* =========================
   CARGAR DATOS DESDE BD
========================= */
async function cargarDatosFlujoProceso() {
    try {
        const respuesta = await fetch("/proyecto_lagmet/php/flujo/listar_flujo_proceso.php", {
            cache: "no-store"
        });

        const data = await respuesta.json();

        if (!data.success) {
            throw new Error(data.message || "No se pudo cargar el flujo de proceso");
        }

        flujoProductosBD = data.productos || [];

        console.log("Productos flujo cargados:", flujoProductosBD);

    } catch (error) {
        console.error("Error cargando flujo proceso:", error);
        flujoProductosBD = [];
    }
}

/* =========================
   CARGAR SELECTORES
========================= */
function cargarSelectoresFlujoProceso() {
    const selectProducto = document.getElementById("selectProductoFlujo");
    const selectOt = document.getElementById("selectOtFlujo");

    if (!selectProducto || !selectOt) return;

    selectProducto.innerHTML = `<option value="">Todos los productos</option>`;
    selectOt.innerHTML = `<option value="">Todas las OT</option>`;

    flujoProductosBD.forEach(producto => {
        const optionProducto = document.createElement("option");
        optionProducto.value = producto.id;
        optionProducto.textContent = producto.producto;
        selectProducto.appendChild(optionProducto);

        const optionOt = document.createElement("option");
        optionOt.value = producto.id;
        optionOt.textContent = producto.numero_pedido;
        selectOt.appendChild(optionOt);
    });
}

/* =========================
   EVENTOS
========================= */
function configurarEventosFlujoProceso() {
    const btnCargar = document.getElementById("btnCargarFlujo");
    const selectProducto = document.getElementById("selectProductoFlujo");
    const selectOt = document.getElementById("selectOtFlujo");
    const board = document.getElementById("flujoBoard");

    if (selectProducto) {
        selectProducto.onchange = () => {
            const idProducto = selectProducto.value;

            if (selectOt) {
                selectOt.value = idProducto;
            }
        };
    }

    if (selectOt) {
        selectOt.onchange = () => {
            const idProducto = selectOt.value;

            if (selectProducto) {
                selectProducto.value = idProducto;
            }
        };
    }

    if (btnCargar) {
        btnCargar.onclick = cargarFlujoSeleccionado;
    }

    if (board) {
        board.onclick = e => {
            const btnPlus = e.target.closest(".flujo-grid-plus");

            if (btnPlus) {
                e.stopPropagation();

                const direccion = btnPlus.dataset.direccion || "right";
                const origen = btnPlus.dataset.origen || "operacion";
                const indexBase = parseInt(btnPlus.dataset.indexBase || "-1", 10);

                if (Number.isNaN(indexBase) || indexBase < 0) return;

                if (origen === "placeholder") {
                    avanzarDesdeCardVacia(indexBase, direccion);
                    return;
                }

                if (direccion === "down") {
                    crearCardVaciaAbajo(indexBase);
                    return;
                }

                avanzarFlujoProceso(direccion);
                return;
            }

            const cardTemporal = e.target.closest('[data-tipo-card="vacia"], [data-tipo-card="temporal"]');

            if (cardTemporal) {
                const indexBase = parseInt(cardTemporal.dataset.indexBase || "-1", 10);
                const posicionVacia = parseInt(cardTemporal.dataset.posicionVacia || "-1", 10);

                if (!Number.isNaN(indexBase) && !Number.isNaN(posicionVacia)) {
                    abrirModalEditarOperacionTemporalFlujo(indexBase, posicionVacia);
                }

                return;
            }

            const cardReal = e.target.closest('[data-tipo-card="real"]');

            if (cardReal) {
                const indexOperacion = parseInt(cardReal.dataset.operacionIndex || "-1", 10);

                if (!Number.isNaN(indexOperacion) && indexOperacion >= 0) {
                    abrirModalEditarOperacionRealFlujo(indexOperacion);
                }
            }
        };
    }

    configurarEventosModalFlujo();

    if (!window.__flujoResizeRegistrado) {
        window.__flujoResizeRegistrado = true;

        let resizeTimer = null;

        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(() => {
                dibujarConectoresDinamicosFlujo();
            }, 120);
        });
    }
}
/* =========================
   CARGAR FLUJO SELECCIONADO
========================= */
function cargarFlujoSeleccionado() {
    const selectProducto = document.getElementById("selectProductoFlujo");
    const selectOt = document.getElementById("selectOtFlujo");

    const idSeleccionado = selectProducto?.value || selectOt?.value || "";

    if (!idSeleccionado) {
        alert("Selecciona un producto para cargar su flujo");
        return;
    }

    flujoProductoSeleccionado = flujoProductosBD.find(p => String(p.id) === String(idSeleccionado));

    if (!flujoProductoSeleccionado) {
        alert("No se encontró el producto seleccionado");
        return;
    }

    flujoCantidadOperacionesVisibles = 1;
    flujoCardsVaciasAbajo = {};

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

/* =========================
   RENDERIZAR FLUJO
   Grilla dinámica tipo Excel con avance progresivo y cards vacías
========================= */
function renderizarFlujoProducto(producto) {
    const board = document.getElementById("flujoBoard");

    if (!board) return;

    const operaciones = obtenerOperacionesOrdenadas(producto);

    if (operaciones.length === 0) {
        board.innerHTML = `
            <div class="flujo-empty-state">
                <span class="material-symbols-outlined">account_tree</span>
                <h3>Producto sin operaciones</h3>
                <p>Este producto no tiene máquinas asociadas para construir el flujo.</p>
            </div>
        `;
        return;
    }

    const columnas = obtenerColumnasFlujo(operaciones);
    const operacionesVisibles = obtenerOperacionesVisibles(producto);

    board.innerHTML = `
        <div class="flujo-grid-proceso" style="--flujo-columnas: ${columnas.length};">

            <div class="flujo-grid-header">
                ${columnas.map(columna => `
                    <div class="flujo-grid-header-cell">
                        ${escaparHTML(columna)}
                    </div>
                `).join("")}
            </div>

            <div class="flujo-grid-body">
                ${columnas.map(columna => {
                    const operacionesColumna = operacionesVisibles
                        .map((operacion, index) => ({ ...operacion, indexGlobal: index }))
                        .filter(operacion => obtenerNombreColumnaOperacion(operacion) === columna);

                    return `
                        <div class="flujo-grid-column">
                            ${operacionesColumna.map(operacion => {
                                const siguienteVisible = operacionesVisibles[operacion.indexGlobal + 1] || null;
                                const siguienteReal = operaciones[operacion.indexGlobal + 1] || null;

                                const cardsTemporales = Array.isArray(flujoCardsVaciasAbajo[operacion.indexGlobal])
                                    ? flujoCardsVaciasAbajo[operacion.indexGlobal]
                                    : [];

                                const cantidadVacias = cardsTemporales.length;
                                const tieneCardVaciaAbajo = cantidadVacias > 0;

                                let tipoConector = "none";
                                let haySiguienteOculto = Boolean(siguienteReal) && !siguienteVisible;

                                if (tieneCardVaciaAbajo) {
                                    tipoConector = "down";
                                    haySiguienteOculto = false;
                                } else if (siguienteVisible) {
                                    const columnaActual = obtenerNombreColumnaOperacion(operacion);
                                    const columnaSiguiente = obtenerNombreColumnaOperacion(siguienteVisible);

                                    tipoConector = columnaActual === columnaSiguiente ? "down" : "right";
                                }

                                const cardPrincipal = crearTarjetaOperacion(
                                    operacion,
                                    operacion.indexGlobal,
                                    tipoConector,
                                    haySiguienteOculto
                                );

                                const cardsVacias = crearCardsVaciasAbajo(
                                    operacion,
                                    operacion.indexGlobal,
                                    cardsTemporales,
                                    siguienteVisible,
                                    siguienteReal
                                );

                                return cardPrincipal + cardsVacias;
                            }).join("")}
                        </div>
                    `;
                }).join("")}
            </div>

        </div>
    `;

    requestAnimationFrame(() => {
        dibujarConectoresDinamicosFlujo();
    });
}

/* =========================
   CREAR CARDS VACÍAS ABAJO
========================= */
function crearCardsVaciasAbajo(operacionBase, indexBase, cardsTemporales = [], siguienteVisible, siguienteReal) {
    if (!Array.isArray(cardsTemporales) || cardsTemporales.length <= 0) return "";

    let html = "";

    const cantidadVacias = cardsTemporales.length;

    for (let i = 1; i <= cantidadVacias; i++) {
        const esUltimaVacia = i === cantidadVacias;
        const cardTemporal = cardsTemporales[i - 1];

        let tipoConector = "none";
        let mostrarBotones = false;

        if (!esUltimaVacia) {
            tipoConector = "down";
        } else if (siguienteVisible) {
            const columnaActual = obtenerNombreColumnaOperacion(operacionBase);
            const columnaSiguiente = obtenerNombreColumnaOperacion(siguienteVisible);

            tipoConector = columnaActual === columnaSiguiente ? "down" : "right-up";
        } else if (siguienteReal) {
            mostrarBotones = true;
        }

        html += crearTarjetaVaciaOperacion(
            indexBase,
            i,
            cardTemporal,
            tipoConector,
            mostrarBotones
        );
    }

    return html;
}

/* =========================
   CREAR TARJETA VACÍA / TEMPORAL
========================= */
function crearTarjetaVaciaOperacion(indexBase, numeroPlaceholder, cardTemporal, tipoConector = "none", mostrarBotones = false) {
    const accionHTML = mostrarBotones
        ? `
            <button 
                class="flujo-grid-plus flujo-plus-right" 
                data-origen="placeholder"
                data-direccion="right"
                data-index-base="${indexBase}"
                title="Continuar flujo hacia la derecha">
                +
            </button>

            <button 
                class="flujo-grid-plus flujo-plus-down" 
                data-origen="placeholder"
                data-direccion="down"
                data-index-base="${indexBase}"
                title="Crear otra operación debajo">
                +
            </button>
        `
        : "";

    const atributosDinamicos = tipoConector === "right-up"
        ? `data-conector-dinamico="right-up" data-index-base="${indexBase}"`
        : "";

    const estaEditada = Boolean(cardTemporal?.editada);

    if (estaEditada) {
        const numeroVisual = obtenerNumeroVisualCardTemporal(indexBase, numeroPlaceholder);
        const titulo = cardTemporal.nombre || "Operación temporal";
        const duracion = formatearDuracion(cardTemporal.horas, cardTemporal.minutos);

        return `
            <div 
                class="flujo-grid-card-wrapper flujo-card-temporal-wrapper conector-${tipoConector}"
                data-card-temporal="true"
                data-index-base="${indexBase}"
                data-posicion-vacia="${numeroPlaceholder}"
                ${atributosDinamicos}>

                <div 
                    class="flujo-grid-card flujo-grid-card-temporal-editada"
                    data-tipo-card="temporal"
                    data-index-base="${indexBase}"
                    data-posicion-vacia="${numeroPlaceholder}">

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

    return `
        <div 
            class="flujo-grid-card-wrapper flujo-card-vacia-wrapper conector-${tipoConector}"
            data-card-temporal="true"
            data-index-base="${indexBase}"
            data-posicion-vacia="${numeroPlaceholder}"
            ${atributosDinamicos}>

            <div 
                class="flujo-grid-card flujo-grid-card-vacia"
                data-tipo-card="vacia"
                data-index-base="${indexBase}"
                data-posicion-vacia="${numeroPlaceholder}"
                title="Editar nueva operación">

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

/* =========================
   DIBUJAR CONECTORES DINÁMICOS
   Une última card vacía con card real derecha
   usando bordes reales de las cards
========================= */
function dibujarConectoresDinamicosFlujo() {
    const body = document.querySelector("#flujoBoard .flujo-grid-body");

    if (!body) return;

    body.querySelectorAll(".flujo-conectores-svg").forEach(svg => svg.remove());

    const fuentes = body.querySelectorAll('[data-conector-dinamico="right-up"]');

    if (fuentes.length === 0) return;

    const bodyRect = body.getBoundingClientRect();
    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.classList.add("flujo-conectores-svg");
    svg.setAttribute("width", bodyRect.width);
    svg.setAttribute("height", bodyRect.height);
    svg.setAttribute("viewBox", `0 0 ${bodyRect.width} ${bodyRect.height}`);

    const defs = document.createElementNS(svgNS, "defs");

    const marker = document.createElementNS(svgNS, "marker");
    marker.setAttribute("id", "flujoArrowHead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "14");
    marker.setAttribute("refX", "10");
    marker.setAttribute("refY", "7");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "userSpaceOnUse");

    const arrow = document.createElementNS(svgNS, "polygon");
    arrow.setAttribute("points", "0 0, 10 7, 0 14");
    arrow.setAttribute("fill", "#247cff");

    marker.appendChild(arrow);
    defs.appendChild(marker);
    svg.appendChild(defs);

    fuentes.forEach(fuente => {
        const indexBase = parseInt(fuente.dataset.indexBase || "-1", 10);
        const indexDestino = indexBase + 1;

        const destino = body.querySelector(`[data-operacion-index="${indexDestino}"]`);

        if (!destino) return;

        const cardOrigen = fuente.querySelector(".flujo-grid-card");
        const cardDestino = destino.querySelector(".flujo-grid-card");

        if (!cardOrigen || !cardDestino) return;

        const puntoOrigen = obtenerPuntoBordeDerechoCardFlujo(cardOrigen, body);
        const puntoDestino = obtenerPuntoBordeIzquierdoCardFlujo(cardDestino, body);

        if (!puntoOrigen || !puntoDestino) return;

        const startX = puntoOrigen.x;
        const startY = puntoOrigen.y;

        const endX = puntoDestino.x;
        const endY = puntoDestino.y;

        if (endX <= startX) return;

        const distanciaX = endX - startX;

        /*
            Codo controlado:
            - Sale desde el borde derecho real de la card origen.
            - Sube o baja si corresponde.
            - Termina justo en el borde izquierdo real de la card destino.
        */
        const codoX = startX + Math.max(36, distanciaX * 0.35);

        const path = document.createElementNS(svgNS, "path");

        path.setAttribute(
            "d",
            [
                `M ${startX} ${startY}`,
                `L ${codoX} ${startY}`,
                `L ${codoX} ${endY}`,
                `L ${endX} ${endY}`
            ].join(" ")
        );

        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#247cff");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("marker-end", "url(#flujoArrowHead)");

        svg.appendChild(path);
    });

    body.appendChild(svg);
}

/* =========================
   PUNTOS DE ANCLAJE REALES
========================= */
function obtenerPuntoBordeDerechoCardFlujo(card, body) {
    if (!card || !body) return null;

    const cardRect = card.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();

    return {
        x: cardRect.right - bodyRect.left,
        y: cardRect.top - bodyRect.top + (cardRect.height / 2)
    };
}

function obtenerPuntoBordeIzquierdoCardFlujo(card, body) {
    if (!card || !body) return null;

    const cardRect = card.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();

    return {
        x: cardRect.left - bodyRect.left,
        y: cardRect.top - bodyRect.top + (cardRect.height / 2)
    };
}
/* =========================
   TABLA DETALLE
========================= */
function renderizarTablaDetalleFlujo(producto) {
    const tbody = document.getElementById("tablaDetalleFlujo");

    if (!tbody) return;

    const operacionesVisibles = obtenerOperacionesVisibles(producto);

    if (operacionesVisibles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="flujo-table-empty">
                    Sin operaciones cargadas
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = operacionesVisibles.map((op, index) => {
        const esCC = esOperacionControlCalidad(op);

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${escaparHTML(producto.producto)}</td>
                <td>${esCC ? "Control de Calidad" : escaparHTML(op.maquina)}</td>
                <td>${esCC ? "Aprobación final" : "Proceso máquina"}</td>
                <td>--</td>
                <td>--</td>
                <td>${esCC ? "00:00" : formatearDuracion(op.horas, op.minutos)}</td>
                <td>
                    <span class="estado-ok">
                        ${esCC ? "Final" : "Cargado"}
                    </span>
                </td>
                <td>${esCC ? "CC agregado automáticamente" : "-"}</td>
            </tr>
        `;
    }).join("");
}

/* =========================
   RESUMEN
========================= */
function renderizarResumenFlujo(producto) {
    const operaciones = obtenerOperacionesOrdenadas(producto);
    const operacionesVisibles = obtenerOperacionesVisibles(producto);

    const totalProductos = document.getElementById("resumenTotalProductos");
    const totalOperaciones = document.getElementById("resumenTotalOperaciones");
    const tiempoEstimado = document.getElementById("resumenTiempoEstimado");
    const progreso = document.getElementById("resumenProgreso");
    const barra = document.getElementById("barraProgresoFlujo");

    const minutosTotales = operaciones.reduce((acc, op) => {
        return acc + ((parseInt(op.horas) || 0) * 60) + (parseInt(op.minutos) || 0);
    }, 0);

    const porcentaje = operaciones.length > 0
        ? Math.round((operacionesVisibles.length / operaciones.length) * 100)
        : 0;

    if (totalProductos) totalProductos.textContent = "1";
    if (totalOperaciones) totalOperaciones.textContent = `${operacionesVisibles.length} / ${operaciones.length}`;
    if (tiempoEstimado) tiempoEstimado.textContent = convertirMinutosAHHMM(minutosTotales);
    if (progreso) progreso.textContent = `${porcentaje}%`;
    if (barra) barra.style.width = `${porcentaje}%`;
}

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

/* =========================
   NUMERACIÓN VISUAL
========================= */
function contarCardsTemporalesEditadasAntes(indexOperacion) {
    let total = 0;

    Object.entries(flujoCardsVaciasAbajo).forEach(([indexBase, cards]) => {
        const base = parseInt(indexBase, 10);

        if (Number.isNaN(base)) return;
        if (base >= indexOperacion) return;
        if (!Array.isArray(cards)) return;

        total += cards.filter(card => card.editada).length;
    });

    return total;
}

function obtenerNumeroVisualOperacionReal(indexOperacion) {
    return indexOperacion + 1 + contarCardsTemporalesEditadasAntes(indexOperacion);
}

function obtenerNumeroVisualCardTemporal(indexBase, posicionVacia) {
    return obtenerNumeroVisualOperacionReal(indexBase) + posicionVacia;
}

/* =========================
   HELPERS
========================= */
function formatearDuracion(horas, minutos) {
    const h = parseInt(horas) || 0;
    const m = parseInt(minutos) || 0;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function convertirMinutosAHHMM(totalMinutos) {
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function escaparHTML(texto) {
    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================
   FUNCIÓN GLOBAL
========================= */
window.iniciarFlujoProceso = iniciarFlujoProceso;