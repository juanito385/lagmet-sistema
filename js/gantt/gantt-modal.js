/* =========================
   MODAL DETALLE GANTT
========================= */
function abrirDetalleGantt(producto, pedido, inicio, fin, maquina, estado, operador = "Admin", maquinasUtilizadas = "--"){

    const modal = document.getElementById("modalDetalleGantt");

    if (!modal) {
        console.warn("No existe #modalDetalleGantt");
        return;
    }

    const estadoTexto = estado.replace("gantt-", "").replace("-", " ");

    document.getElementById("detalleGanttProducto").textContent = producto;
    document.getElementById("detalleGanttPedido").textContent = `Nota de venta: ${pedido}`;
    document.getElementById("detalleGanttInicio").textContent = inicio;
    document.getElementById("detalleGanttFin").textContent = fin;

    document.getElementById("detalleGanttMaquina").textContent = maquina;
    document.getElementById("detalleGanttOperador").textContent = operador;

    const detalleMaquinasTodas = document.getElementById("detalleGanttMaquinasTodas");

    if (detalleMaquinasTodas) {
        detalleMaquinasTodas.textContent = maquinasUtilizadas || "--";
    }

    const badge = document.getElementById("detalleGanttEstado");
    badge.textContent = estadoTexto;
    badge.className = `modal-gantt-badge ${estado}`;

    modal.classList.add("active");
}

function cerrarDetalleGantt(){
    const modal = document.getElementById("modalDetalleGantt");
    if (modal) modal.classList.remove("active");
}

window.abrirDetalleGantt = abrirDetalleGantt;
window.cerrarDetalleGantt = cerrarDetalleGantt;