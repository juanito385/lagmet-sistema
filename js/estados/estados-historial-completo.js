/* =========================
   HISTORIAL COMPLETO DE ESTADOS
   Modal externo cargado dinámicamente
========================= */

let historialCompletoData = [];
let historialCompletoCargado = false;

/* =========================
   CARGAR HTML EXTERNO
========================= */
async function cargarModalHistorialCompletoHTML() {
    const yaExiste = document.getElementById("modalHistorialCompletoOverlay");

    if (yaExiste) {
        return;
    }

    try {
        const response = await fetch("views/estados/modal-historial-completo.html");

        if (!response.ok) {
            throw new Error("No se pudo cargar modal-historial-completo.html");
        }

        const html = await response.text();

        document.body.insertAdjacentHTML("beforeend", html);

        historialCompletoCargado = true;

    } catch (error) {
        console.error("Error cargando HTML del historial completo:", error);
        alert("No se pudo cargar la ventana de historial completo.");
    }
}

/* =========================
   ABRIR / CERRAR MODAL
========================= */
async function abrirHistorialCompletoEstado() {
    if (!estadoProduccionSeleccionada) {
        alert("Primero selecciona una orden de trabajo.");
        return;
    }

    await cargarModalHistorialCompletoHTML();

    const modal = document.getElementById("modalHistorialCompletoOverlay");

    if (!modal) return;

    modal.classList.add("active");

    cargarInfoHistorialCompleto();
    await cargarDatosHistorialCompleto(estadoProduccionSeleccionada.id);
}

function cerrarHistorialCompletoEstado() {
    const modal = document.getElementById("modalHistorialCompletoOverlay");

    if (modal) {
        modal.classList.remove("active");
    }
}

/* =========================
   CARGAR INFO DE ORDEN
========================= */
function cargarInfoHistorialCompleto() {
    if (!estadoProduccionSeleccionada) return;

    actualizarTextoHistorialCompleto(
        "historialCompletoOT",
        estadoProduccionSeleccionada.orden || "Sin orden"
    );

    actualizarTextoHistorialCompleto(
        "historialCompletoProducto",
        estadoProduccionSeleccionada.producto || "Sin producto"
    );

    actualizarTextoHistorialCompleto(
        "historialCompletoMaquina",
        estadoProduccionSeleccionada.maquina || "Sin máquina"
    );

    actualizarTextoHistorialCompleto(
        "historialCompletoSubtitulo",
        `Historial completo de la orden ${estadoProduccionSeleccionada.orden || "sin orden"}`
    );
}

function actualizarTextoHistorialCompleto(id, texto) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto;
    }
}

/* =========================
   CARGAR DATOS DESDE PHP
========================= */
async function cargarDatosHistorialCompleto(produccionId) {
    const contenedor = document.getElementById("historialCompletoContenido");

    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="historial-completo-vacio">
            <span class="material-symbols-outlined">hourglass_top</span>
            <p>Cargando historial completo...</p>
        </div>
    `;

    try {
        const response = await fetch(`php/estados/obtener_historial_estado.php?produccion_id=${produccionId}`);
        const data = await response.json();

        if (!data.success) {
            contenedor.innerHTML = `
                <div class="historial-completo-vacio">
                    <span class="material-symbols-outlined">error</span>
                    <p>${escaparHTML(data.message || "No se pudo cargar el historial.")}</p>
                </div>
            `;
            return;
        }

        historialCompletoData = Array.isArray(data.data) ? data.data : [];

        renderHistorialCompleto(historialCompletoData);
        actualizarResumenHistorialCompleto(historialCompletoData);

    } catch (error) {
        console.error("Error cargando historial completo:", error);

        contenedor.innerHTML = `
            <div class="historial-completo-vacio">
                <span class="material-symbols-outlined">wifi_off</span>
                <p>Error de conexión al cargar el historial completo.</p>
            </div>
        `;
    }
}

/* =========================
   RENDER HISTORIAL COMPLETO
========================= */
function renderHistorialCompleto(lista) {
    const contenedor = document.getElementById("historialCompletoContenido");
    const resumenTexto = document.getElementById("historialCompletoResumenTexto");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!lista || lista.length === 0) {
        contenedor.innerHTML = `
            <div class="historial-completo-vacio">
                <span class="material-symbols-outlined">info</span>
                <p>No hay movimientos registrados para esta orden.</p>
            </div>
        `;

        if (resumenTexto) {
            resumenTexto.textContent = "Mostrando 0 movimientos";
        }

        return;
    }

    const grupos = {};

    lista.forEach(item => {
        const grupo = obtenerGrupoFechaHistorial(item.fecha_cambio);

        if (!grupos[grupo]) {
            grupos[grupo] = [];
        }

        grupos[grupo].push(item);
    });

    Object.keys(grupos).forEach(nombreGrupo => {
        const separadorFecha = document.createElement("div");
        separadorFecha.className = "historial-completo-grupo-fecha";

        separadorFecha.innerHTML = `
            <span class="material-symbols-outlined">calendar_month</span>
            <span>${escaparHTML(nombreGrupo)}</span>
        `;

        contenedor.appendChild(separadorFecha);

        grupos[nombreGrupo].forEach(item => {
            const estado = item.estado_nuevo || "pendiente";
            const clase = obtenerClaseTimelineEstado(estado);
            const icono = obtenerIconoHistorialEstado(estado);
            const tooltip = obtenerTooltipHistorialEstado(estado);

            const fila = document.createElement("div");
            fila.className = "historial-completo-row";

            fila.innerHTML = `
                <div class="historial-completo-fecha"></div>

                <div>
                    <span 
                        class="historial-completo-icono material-symbols-outlined ${clase}"
                        title="${escaparHTML(tooltip)}"
                        aria-label="${escaparHTML(tooltip)}">
                        ${icono}
                    </span>
                </div>

                <div class="historial-completo-hora">
                    ${escaparHTML(formatearSoloHoraHistorial(item.fecha_cambio))}
                </div>

                <div class="historial-completo-operador">
                    ${escaparHTML(item.usuario_nombre || "Admin")}
                </div>

                <div class="historial-completo-detalle">
                    ${escaparHTML(item.observacion || "Cambio de estado registrado")}
                </div>
            `;

            contenedor.appendChild(fila);
        });
    });

    if (resumenTexto) {
        resumenTexto.textContent = `Mostrando ${lista.length} movimiento${lista.length === 1 ? "" : "s"}`;
    }
}

/* =========================
   RESUMEN SUPERIOR
========================= */
function actualizarResumenHistorialCompleto(lista) {
    const total = lista.length;

    const pausas = lista.filter(item => {
        return normalizarEstadoHistorial(item.estado_nuevo) === "pausado";
    }).length;

    const reanudaciones = lista.filter(item => {
        const estado = normalizarEstadoHistorial(item.estado_nuevo);
        return estado === "en_proceso" || estado === "proceso" || estado === "reanudado";
    }).length;

    const entregas = lista.filter(item => {
        const estado = normalizarEstadoHistorial(item.estado_nuevo);
        return estado === "entregado" || estado === "marcado_como_entregado";
    }).length;

    actualizarTextoHistorialCompleto("historialCompletoTotal", total);
    actualizarTextoHistorialCompleto("historialCompletoPausas", pausas);
    actualizarTextoHistorialCompleto("historialCompletoReanudaciones", reanudaciones);
    actualizarTextoHistorialCompleto("historialCompletoEntregas", entregas);
}

/* =========================
   FILTROS
========================= */
function filtrarHistorialCompleto() {
    const buscar = document.getElementById("buscarHistorialCompleto")?.value.toLowerCase().trim() || "";
    const estadoFiltro = document.getElementById("filtroHistorialCompletoEstado")?.value || "todos";

    let filtrados = [...historialCompletoData];

    if (buscar !== "") {
        filtrados = filtrados.filter(item => {
            const observacion = (item.observacion || "").toLowerCase();
            const usuario = (item.usuario_nombre || "").toLowerCase();
            const estado = formatearTextoEstado(item.estado_nuevo || "").toLowerCase();
            const fecha = formatearFechaGrupoHistorial(item.fecha_cambio).toLowerCase();

            return observacion.includes(buscar) ||
                   usuario.includes(buscar) ||
                   estado.includes(buscar) ||
                   fecha.includes(buscar);
        });
    }

    if (estadoFiltro !== "todos") {
        filtrados = filtrados.filter(item => {
            const estado = normalizarEstadoHistorial(item.estado_nuevo);

            if (estadoFiltro === "en_proceso") {
                return estado === "en_proceso" || estado === "proceso" || estado === "reanudado";
            }

            return estado === estadoFiltro;
        });
    }

    renderHistorialCompleto(filtrados);
}

function limpiarFiltrosHistorialCompleto() {
    const buscar = document.getElementById("buscarHistorialCompleto");
    const estado = document.getElementById("filtroHistorialCompletoEstado");

    if (buscar) buscar.value = "";
    if (estado) estado.value = "todos";

    renderHistorialCompleto(historialCompletoData);
}

/* =========================
   EVENTOS
========================= */
if (!window.__historialCompletoEstadosInicializado) {
    window.__historialCompletoEstadosInicializado = true;

    document.addEventListener("click", async function (e) {
        const btnAbrir = e.target.closest(".btn-historial-completo");

        if (btnAbrir) {
            e.preventDefault();
            await abrirHistorialCompletoEstado();
            return;
        }

        const btnCerrar = e.target.closest("#btnCerrarHistorialCompletoFooter");

        if (btnCerrar) {
            cerrarHistorialCompletoEstado();
            return;
        }

        const overlay = e.target.closest("#modalHistorialCompletoOverlay");

        if (overlay && e.target.id === "modalHistorialCompletoOverlay") {
            cerrarHistorialCompletoEstado();
            return;
        }

        const btnLimpiar = e.target.closest("#btnLimpiarHistorialCompleto");

        if (btnLimpiar) {
            limpiarFiltrosHistorialCompleto();
            return;
        }
    });

    document.addEventListener("input", function (e) {
        if (e.target && e.target.id === "buscarHistorialCompleto") {
            filtrarHistorialCompleto();
        }
    });

    document.addEventListener("change", function (e) {
        if (e.target && e.target.id === "filtroHistorialCompletoEstado") {
            filtrarHistorialCompleto();
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            cerrarHistorialCompletoEstado();
        }
    });
}