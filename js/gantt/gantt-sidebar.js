/* =========================
   SIDEBAR GANTT NORMAL
========================= */
function renderGanttSidebar(tareasSidebar) {
    const sidebar = document.getElementById("gantt-sidebar");
    if (!sidebar) return;

    sidebar.innerHTML = `
        <div class="gantt-side-head">
            <strong>Producto</strong>
            <strong>Máquina</strong>
            <strong>Operador</strong>
        </div>
    `;

    tareasSidebar.forEach(item => {
        const fila = document.createElement("div");
        fila.className = "gantt-side-row";

        fila.innerHTML = `
            <div class="gantt-side-producto">
                <span class="gantt-color-dot" style="background:${colorEstado(item.claseEstado)}"></span>
                <strong>${item.producto}</strong>
                <small>(${item.pedido})</small>
            </div>
            <div>${item.maquina}</div>
            <div>${item.operador}</div>
        `;

        sidebar.appendChild(fila);
    });
}