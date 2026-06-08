console.log("ARCHIVO flujo-proceso.js CARGADO CORRECTAMENTE");

/* =========================
   FLUJO PROCESO
   Render dinámico con avance progresivo
========================= */

let flujoProductosBD = [];
let flujoProductoSeleccionado = null;
let flujoCantidadOperacionesVisibles = 1;

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

            avanzarFlujoProceso();
        };
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

    renderizarFlujoProducto(flujoProductoSeleccionado);
    renderizarTablaDetalleFlujo(flujoProductoSeleccionado);
    renderizarResumenFlujo(flujoProductoSeleccionado);
}

/* =========================
   AVANZAR FLUJO PROCESO
========================= */
function avanzarFlujoProceso() {
    if (!flujoProductoSeleccionado) return;

    const operaciones = obtenerOperacionesOrdenadas(flujoProductoSeleccionado);

    if (flujoCantidadOperacionesVisibles >= operaciones.length) {
        return;
    }

    flujoCantidadOperacionesVisibles++;

    renderizarFlujoProducto(flujoProductoSeleccionado);
    renderizarTablaDetalleFlujo(flujoProductoSeleccionado);
    renderizarResumenFlujo(flujoProductoSeleccionado);
}

/* =========================
   RENDERIZAR FLUJO
   Grilla dinámica tipo Excel con avance progresivo
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

                                let tipoConector = "none";

                                if (siguienteVisible) {
                                    const columnaActual = obtenerNombreColumnaOperacion(operacion);
                                    const columnaSiguiente = obtenerNombreColumnaOperacion(siguienteVisible);

                                    tipoConector = columnaActual === columnaSiguiente ? "down" : "right";
                                }

                                const haySiguienteOculto = Boolean(siguienteReal) && !siguienteVisible;

                                return crearTarjetaOperacion(
                                    operacion,
                                    operacion.indexGlobal,
                                    tipoConector,
                                    haySiguienteOculto
                                );
                            }).join("")}
                        </div>
                    `;
                }).join("")}
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
            <button class="flujo-grid-plus" title="Mostrar siguiente operación">
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
        <div class="flujo-grid-card-wrapper conector-${tipoConector}">
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