/* =========================
   ÚLTIMOS REGISTROS
========================= */
function cargarUltimosRegistros(registros) {
    const tbody = document.getElementById("tablaUltimosRegistros");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!registros || !registros.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">No hay registros disponibles</td>
            </tr>
        `;
        return;
    }

    registros.forEach(item => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>#${item.id ?? ""}</td>
            <td>${item.producto ?? ""}</td>
            <td>${formatearMaquinas(item.maquinas_usadas)}</td>
            <td>${item.turno ?? "Sin turno"}</td>
            <td><span class="badge-blue">${item.cantidad ?? 0} piezas</span></td>
            <td>${formatearFecha(item.fecha)}</td>
            <td>${item.usuario ?? "Admin"}</td>
        `;

        tbody.appendChild(fila);
    });
}