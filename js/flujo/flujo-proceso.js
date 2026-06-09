console.log("ARCHIVO flujo-proceso.js CARGADO CORRECTAMENTE");

/* =========================
   FLUJO PROCESO
   Render dinámico con avance progresivo
========================= */

let flujoProductosBD = [];
let flujoProductoSeleccionado = null;
let flujoCantidadOperacionesVisibles = 1;

/*
    Cards vacías creadas temporalmente.
    Clave: índice de la operación base.
    Valor: cantidad de cards vacías hacia abajo.
*/
let flujoCardsVaciasAbajo = {};

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

            if (!btnPlus) return;

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
        };
    }

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

    flujoCardsVaciasAbajo[indexBase] = (flujoCardsVaciasAbajo[indexBase] || 0) + 1;

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

                                const cantidadVacias = flujoCardsVaciasAbajo[operacion.indexGlobal] || 0;
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
                                    cantidadVacias,
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
function crearCardsVaciasAbajo(operacionBase, indexBase, cantidadVacias, siguienteVisible, siguienteReal) {
    if (cantidadVacias <= 0) return "";

    let html = "";

    for (let i = 1; i <= cantidadVacias; i++) {
        const esUltimaVacia = i === cantidadVacias;

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
            tipoConector,
            mostrarBotones
        );
    }

    return html;
}

/* =========================
   CREAR TARJETA VACÍA
========================= */
function crearTarjetaVaciaOperacion(indexBase, numeroPlaceholder, tipoConector = "none", mostrarBotones = false) {
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

    return `
        <div 
            class="flujo-grid-card-wrapper flujo-card-vacia-wrapper conector-${tipoConector}"
            ${atributosDinamicos}>

            <div class="flujo-grid-card flujo-grid-card-vacia">

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
========================= */
function obtenerOperacionesOrdenadas(producto) {
    const operaciones = [...(producto?.operaciones || [])];

    operaciones.sort((a, b) => {
        const ordenA = a.orden !== null && a.orden !== undefined ? Number(a.orden) : 999999;
        const ordenB = b.orden !== null && b.orden !== undefined ? Number(b.orden) : 999999;

        if (ordenA !== ordenB) {
            return ordenA - ordenB;
        }

        return Number(a.id || 0) - Number(b.id || 0);
    });

    return operaciones;
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
    if (operacion.tipo === "control_calidad") {
        return "Control de Calidad (CC)";
    }

    return operacion.maquina || "Sin máquina";
}

/* =========================
   CREAR TARJETA
========================= */
function crearTarjetaOperacion(operacion, index, tipoConector = "none", haySiguienteOculto = false) {
    const esCC = operacion.tipo === "control_calidad";

    const titulo = esCC
        ? "Control de calidad"
        : operacion.maquina;

    const duracion = esCC
        ? "Cierre final"
        : formatearDuracion(operacion.horas, operacion.minutos);

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

    return `
        <div 
            class="flujo-grid-card-wrapper conector-${tipoConector}"
            data-operacion-index="${index}">

            <div class="flujo-grid-card ${esCC ? "flujo-grid-card-cc" : ""}">

                <div class="flujo-grid-card-numero">
                    ${index + 1}
                </div>

                <div class="flujo-grid-card-info">
                    <strong>${index + 1}. ${escaparHTML(titulo)}</strong>
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
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "8");
    marker.setAttribute("refY", "3");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");

    const arrowPath = document.createElementNS(svgNS, "path");
    arrowPath.setAttribute("d", "M0,0 L0,6 L9,3 z");
    arrowPath.setAttribute("fill", "#247cff");

    marker.appendChild(arrowPath);
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

        const origenRect = cardOrigen.getBoundingClientRect();
        const destinoRect = cardDestino.getBoundingClientRect();

        const startX = origenRect.right - bodyRect.left;
        const startY = origenRect.top + (origenRect.height / 2) - bodyRect.top;

        const endX = destinoRect.left - bodyRect.left;
        const endY = destinoRect.top + (destinoRect.height / 2) - bodyRect.top;

        if (endX <= startX) return;

        const distanciaX = endX - startX;
        const codoX = startX + Math.max(70, distanciaX * 0.45);

        const path = document.createElementNS(svgNS, "path");

        path.setAttribute(
            "d",
            `
                M ${startX} ${startY}
                L ${codoX} ${startY}
                L ${codoX} ${endY}
                L ${endX - 10} ${endY}
            `
        );

        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#247cff");
        path.setAttribute("stroke-width", "2.4");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("marker-end", "url(#flujoArrowHead)");

        svg.appendChild(path);
    });

    body.appendChild(svg);
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
        const esCC = op.tipo === "control_calidad";

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