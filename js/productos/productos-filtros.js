/* =========================
   FILTRAR PRODUCTOS
========================= */
function filtrarProductos() {
    const buscador = document.getElementById("buscadorProductos");
    const filtroFecha = document.getElementById("filtroFechaProductos");

    if (!buscador || !filtroFecha) return;

    const busqueda = buscador.value.toLowerCase().trim();
    const fecha = filtroFecha.value;

    const filas = document.querySelectorAll("#tablaProductos tbody tr");

    filas.forEach(fila => {
        const celdas = fila.querySelectorAll("td");
        if (celdas.length < 5) return;

        const producto = celdas[0].innerText.toLowerCase();
        const pedido = celdas[1].innerText.toLowerCase();
        const codigo = celdas[2].innerText.toLowerCase();
        const cantidad = celdas[3].innerText.toLowerCase();
        const fechaInicio = celdas[4].dataset.fecha || "";

        const coincideBusqueda =
            producto.includes(busqueda) ||
            pedido.includes(busqueda) ||
            codigo.includes(busqueda) ||
            cantidad.includes(busqueda);

        const coincideFecha =
            fecha === "" || fechaInicio === fecha;

        fila.dataset.visible =
            coincideBusqueda && coincideFecha ? "true" : "false";
    });

    paginaActualProductos = 1;
    aplicarPaginacionProductos();
}

/* =========================
   ORDENAR PRODUCTOS
========================= */
function ordenarProductos() {
    const tbody = document.querySelector("#tablaProductos tbody");
    const selectOrden = document.getElementById("ordenProductos");

    if (!tbody || !selectOrden) return;

    const filas = Array.from(tbody.querySelectorAll("tr"));

    if (filas.length <= 1) {
        aplicarPaginacionProductos();
        return;
    }

    const orden = selectOrden.value;

    filas.sort((a, b) => {
        const productoA = a.children[0]?.innerText.toLowerCase() || "";
        const productoB = b.children[0]?.innerText.toLowerCase() || "";

        const fechaA = new Date(a.children[4]?.dataset.fecha || "");
        const fechaB = new Date(b.children[4]?.dataset.fecha || "");

        if (orden === "recientes") return fechaB - fechaA;
        if (orden === "antiguos") return fechaA - fechaB;
        if (orden === "az") return productoA.localeCompare(productoB);
        if (orden === "za") return productoB.localeCompare(productoA);

        return 0;
    });

    filas.forEach(fila => tbody.appendChild(fila));

    filtrarProductos();
}

/* =========================
   LIMPIAR FILTROS PRODUCTOS
========================= */
function limpiarFiltrosProductos() {
    const buscador = document.getElementById("buscadorProductos");
    const filtroFecha = document.getElementById("filtroFechaProductos");
    const orden = document.getElementById("ordenProductos");

    if (buscador) buscador.value = "";
    if (filtroFecha) filtroFecha.value = "";
    if (orden) orden.value = "recientes";

    paginaActualProductos = 1;
    ordenarProductos();
}

window.filtrarProductos = filtrarProductos;
window.ordenarProductos = ordenarProductos;
window.limpiarFiltrosProductos = limpiarFiltrosProductos;