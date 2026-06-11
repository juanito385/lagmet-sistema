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
