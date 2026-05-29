/* =========================
   MODAL DETALLE GANTT
========================= */

function setTextoDetalleGantt(id, valor){
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor || "--";
    }
}

function mostrarElementoGantt(id, mostrar = true){
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.style.display = mostrar ? "" : "none";
    }
}

function limpiarAlertasDetalleGantt(){

    mostrarElementoGantt("detalleGanttAlertas", false);
    mostrarElementoGantt("detalleGanttAlertaAtraso", false);
    mostrarElementoGantt("detalleGanttAlertaReprogramado", false);

    setTextoDetalleGantt("detalleAlertaFechaEstimada", "--");
    setTextoDetalleGantt("detalleAlertaFechaActual", "--");

    setTextoDetalleGantt("detalleReprogramadoInicioOriginal", "--");
    setTextoDetalleGantt("detalleReprogramadoFinOriginal", "--");
    setTextoDetalleGantt("detalleReprogramadoNuevoInicio", "--");
    setTextoDetalleGantt("detalleReprogramadoNuevoFin", "--");
    setTextoDetalleGantt("detalleReprogramadoMotivo", "--");
}

function abrirDetalleGantt(
    producto,
    pedido,
    inicio,
    fin,
    maquina,
    estado,
    operador = "Admin",
    maquinasUtilizadas = "--",
    opciones = {}
){

    const modal = document.getElementById("modalDetalleGantt");

    if (!modal) {
        console.warn("No existe #modalDetalleGantt");
        return;
    }

    const estadoTexto = estado
        .replace("gantt-", "")
        .replace("-", " ");

    setTextoDetalleGantt("detalleGanttProducto", producto);
    setTextoDetalleGantt("detalleGanttPedido", `Nota de venta: ${pedido}`);
    setTextoDetalleGantt("detalleGanttInicio", inicio);
    setTextoDetalleGantt("detalleGanttFin", fin);

    setTextoDetalleGantt("detalleGanttMaquina", maquina);
    setTextoDetalleGantt("detalleGanttOperador", operador);
    setTextoDetalleGantt("detalleGanttMaquinasTodas", maquinasUtilizadas || "--");

    const badge = document.getElementById("detalleGanttEstado");

    if (badge) {
        badge.textContent = estadoTexto;
        badge.className = `modal-gantt-badge ${estado}`;
    }

    limpiarAlertasDetalleGantt();

    const estaAtrasado = opciones.estaAtrasado === true;
    const reprogramado = opciones.reprogramado === true;

    if (estaAtrasado || reprogramado) {
        mostrarElementoGantt("detalleGanttAlertas", true);
    }

    if (estaAtrasado) {
        mostrarElementoGantt("detalleGanttAlertaAtraso", true);

        setTextoDetalleGantt(
            "detalleAlertaFechaEstimada",
            opciones.fechaEstimada || fin || "--"
        );

        setTextoDetalleGantt(
            "detalleAlertaFechaActual",
            opciones.fechaReal || opciones.fechaActual || "--"
        );
    }

    if (reprogramado) {
        mostrarElementoGantt("detalleGanttAlertaReprogramado", true);

        setTextoDetalleGantt(
            "detalleReprogramadoInicioOriginal",
            opciones.inicioOriginal || "--"
        );

        setTextoDetalleGantt(
            "detalleReprogramadoFinOriginal",
            opciones.finOriginal || "--"
        );

        setTextoDetalleGantt(
            "detalleReprogramadoNuevoInicio",
            opciones.nuevoInicio || inicio || "--"
        );

        setTextoDetalleGantt(
            "detalleReprogramadoNuevoFin",
            opciones.nuevoFin || fin || "--"
        );

        setTextoDetalleGantt(
            "detalleReprogramadoMotivo",
            opciones.motivoReprogramacion || "La máquina ya tenía trabajos programados."
        );
    }

    modal.classList.add("active");
}

function cerrarDetalleGantt(){

    const modal = document.getElementById("modalDetalleGantt");

    if (modal) {
        modal.classList.remove("active");
    }
}

function abrirModalAlertasGantt(event, opciones = {}){

    event.stopPropagation();

    const modal = document.getElementById("modalAlertasGantt");
    const titulo = document.getElementById("alertaGanttProducto");
    const subtitulo = document.getElementById("alertaGanttSubtitulo");
    const contenedor = document.getElementById("contenedorAlertasGantt");

    if (!modal || !contenedor) {
        console.warn("No existe el modal de alertas Gantt");
        return;
    }

    if (titulo) {
        titulo.textContent = opciones.producto || "Producto";
    }

    if (subtitulo) {
        subtitulo.textContent = opciones.maquina
            ? `Máquina: ${opciones.maquina}`
            : "Información de alertas y reprogramación";
    }

    let htmlAlertas = "";

    if (opciones.estaAtrasado === true) {
        htmlAlertas += `
            <div class="modal-alerta-card alerta-atraso">
                <div class="modal-alerta-titulo">
                    <span>⚠</span>
                    <strong>Producto atrasado</strong>
                </div>

                <p>La fecha estimada fue superada o el producto terminó fuera del plazo.</p>

                <div class="modal-alerta-datos">
                    <span>Fecha estimada:</span>
                    <strong>${opciones.fechaEstimada || opciones.fin || "--"}</strong>
                </div>

                <div class="modal-alerta-datos">
                    <span>Fecha real / actual:</span>
                    <strong>${opciones.fechaReal || opciones.fechaActual || "--"}</strong>
                </div>
            </div>
        `;
    }

    if (opciones.reprogramado === true) {
        htmlAlertas += `
            <div class="modal-alerta-card alerta-reprogramado">
                <div class="modal-alerta-titulo">
                    <span>↻</span>
                    <strong>Reprogramado por máquina ocupada</strong>
                </div>

                <p>La barra fue movida porque la máquina ya tenía trabajos programados.</p>

                <div class="modal-alerta-datos">
                    <span>Inicio original:</span>
                    <strong>${opciones.inicioOriginal || "--"}</strong>
                </div>

                <div class="modal-alerta-datos">
                    <span>Fin original:</span>
                    <strong>${opciones.finOriginal || "--"}</strong>
                </div>

                <div class="modal-alerta-datos">
                    <span>Nuevo inicio:</span>
                    <strong>${opciones.nuevoInicio || opciones.inicio || "--"}</strong>
                </div>

                <div class="modal-alerta-datos">
                    <span>Nuevo fin:</span>
                    <strong>${opciones.nuevoFin || opciones.fin || "--"}</strong>
                </div>

                <div class="modal-alerta-datos">
                    <span>Motivo:</span>
                    <strong>${opciones.motivoReprogramacion || opciones.motivo || "La máquina ya tenía trabajos programados."}</strong>
                </div>
            </div>
        `;
    }

    if (!htmlAlertas.trim()) {
        htmlAlertas = `
            <div class="modal-alerta-card">
                <p>No hay alertas asociadas a esta barra.</p>
            </div>
        `;
    }

    contenedor.innerHTML = htmlAlertas;
    modal.classList.add("active");
}

function cerrarModalAlertasGantt(){

    const modal = document.getElementById("modalAlertasGantt");

    if (modal) {
        modal.classList.remove("active");
    }
}

/* =========================
   CARGAR MODAL ALERTAS GANTT
========================= */
async function cargarModalAlertasGantt(){

    const contenedor = document.getElementById("contenedorModalAlertasGantt");

    if (!contenedor) return;

    try {
        const respuesta = await fetch(`views/documentacion/gantt-alertas-modal.html?v=${Date.now()}`, {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar gantt-alertas-modal.html");
        }

        contenedor.innerHTML = await respuesta.text();

    } catch (error) {
        console.error("Error cargando modal de alertas Gantt:", error);
    }
}

window.cargarModalAlertasGantt = cargarModalAlertasGantt;
window.abrirModalAlertasGantt = abrirModalAlertasGantt;
window.cerrarModalAlertasGantt = cerrarModalAlertasGantt;

window.abrirDetalleGantt = abrirDetalleGantt;
window.cerrarDetalleGantt = cerrarDetalleGantt;