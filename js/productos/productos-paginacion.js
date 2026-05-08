/* =========================
   PAGINACIÓN PRODUCTOS
========================= */
function obtenerFilasVisiblesProductos() {
    const filas = Array.from(
        document.querySelectorAll("#tablaProductos tbody tr")
    );

    return filas.filter(fila => fila.dataset.visible !== "false");
}

function aplicarPaginacionProductos() {
    const filas = Array.from(
        document.querySelectorAll("#tablaProductos tbody tr")
    );

    const visibles = obtenerFilasVisiblesProductos();

    const totalProductos = visibles.length;
    const totalPaginas = Math.ceil(totalProductos / productosPorPagina) || 1;

    if (paginaActualProductos > totalPaginas) {
        paginaActualProductos = totalPaginas;
    }

    if (paginaActualProductos < 1) {
        paginaActualProductos = 1;
    }

    const inicio = (paginaActualProductos - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;

    filas.forEach(fila => {
        fila.style.display = "none";
    });

    visibles.forEach((fila, index) => {
        fila.style.display =
            index >= inicio && index < fin ? "" : "none";
    });

    actualizarInfoPaginacionProductos(totalProductos, inicio, fin);
    renderNumerosPaginacionProductos(totalPaginas);
}

function actualizarInfoPaginacionProductos(total, inicio, fin) {
    const info = document.getElementById("infoPaginacionProductos");

    if (!info) return;

    if (total === 0) {
        info.textContent = "Mostrando 0 de 0 productos";
        return;
    }

    const desde = inicio + 1;
    const hasta = Math.min(fin, total);

    info.textContent =
        `Mostrando ${desde} a ${hasta} de ${total} productos`;
}

function renderNumerosPaginacionProductos(totalPaginas) {
    const contenedor = document.getElementById("numerosPaginacionProductos");

    if (!contenedor) return;

    contenedor.innerHTML = "";

    for (let i = 1; i <= totalPaginas; i++) {
        if (
            totalPaginas > 4 &&
            i === 4 &&
            paginaActualProductos < totalPaginas - 1
        ) {
            const puntos = document.createElement("span");
            puntos.className = "puntos-paginacion";
            puntos.textContent = "...";

            contenedor.appendChild(puntos);

            i = totalPaginas - 1;
        }

        const boton = document.createElement("button");
        boton.textContent = i;

        if (i === paginaActualProductos) {
            boton.classList.add("activo");
        }

        boton.onclick = () => {
            paginaActualProductos = i;
            aplicarPaginacionProductos();
        };

        contenedor.appendChild(boton);
    }
}

function cambiarPaginaProductos(direccion) {
    const visibles = obtenerFilasVisiblesProductos();
    const totalPaginas = Math.ceil(visibles.length / productosPorPagina) || 1;

    paginaActualProductos += direccion;

    if (paginaActualProductos < 1) {
        paginaActualProductos = 1;
    }

    if (paginaActualProductos > totalPaginas) {
        paginaActualProductos = totalPaginas;
    }

    aplicarPaginacionProductos();
}

window.cambiarPaginaProductos = cambiarPaginaProductos;