/* =========================
   CONFIG PAGINACIÓN PRODUCTOS
========================= */
let paginaActualProductos = 1;
const productosPorPagina = 7;

function obtenerEstadoProducto(fechaFinStr) {
    if (!fechaFinStr || fechaFinStr === "-") {
        return {
            texto: "Sin fecha",
            clase: "estado-sin-fecha"
        };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaFin = new Date(fechaFinStr + "T00:00:00");

    if (fechaFin < hoy) {
        return {
            texto: "Atrasado",
            clase: "estado-atrasado"
        };
    }

    if (fechaFin.getTime() === hoy.getTime()) {
        return {
            texto: "Termina hoy",
            clase: "estado-hoy"
        };
    }

    return {
        texto: "En proceso",
        clase: "estado-proceso"
    };
}

function formatearFechaVisual(fechaStr) {
    if (!fechaStr || fechaStr === "-") return "-";

    const partes = fechaStr.split("-");
    if (partes.length !== 3) return fechaStr;

    const anio = partes[0];
    const mes = partes[1];
    const dia = partes[2];

    return `${dia}/${mes}/${anio}`;
}


/* =========================
   RENDER PRODUCTOS
========================= */
async function renderProductos() {
    const tbody = document.querySelector("#tablaProductos tbody");

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6">Cargando datos...</td>
        </tr>
    `;

    try {
        const response = await fetch("php/obtener_produccion.php");
        const data = await response.json();

        if (!data.success || !data.data.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">No hay productos registrados</td>
                </tr>
            `;

            actualizarInfoPaginacionProductos(0, 0, 0);
            renderNumerosPaginacionProductos(1);
            return;
        }

        tbody.innerHTML = "";

        data.data.forEach(item => {
    const fila = document.createElement("tr");

    const fechaInicio = item.fecha || "-";
    const fechaFin = item.fecha_fin || "-";
    const dias = item.dias || "-";
    const estado = obtenerEstadoProducto(fechaFin);

    fila.innerHTML = `
        <td>${item.producto ?? ""}</td>
        <td>${item.numero_pedido ?? ""}</td>
        <td>${item.codigo ?? ""}</td>
        <td>${item.cantidad ?? ""}</td>
        <td data-fecha="${fechaInicio}">${formatearFechaVisual(fechaInicio)}</td>
        <td data-fecha="${fechaFin}">${formatearFechaVisual(fechaFin)}</td>
        <td>${dias}</td>
            <td>
        <span class="badge-estado ${estado.clase}">
            ${estado.texto}
        </span>
    </td>
        <td>
            <div class="acciones-producto">
                <button class="btn-action editar" onclick="editarProducto(${item.id})" title="Editar">
                    <span class="material-icons">edit</span>
                </button>

                <button class="btn-action eliminar" onclick="eliminarProducto(${item.id})" title="Eliminar">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        </td>
    `;

    fila.dataset.visible = "true";
    tbody.appendChild(fila);
});
        ordenarProductos();

        const documentacion = document.getElementById("documentacion");

        if (documentacion && documentacion.classList.contains("active")) {
            if (typeof mostrarGantt === "function") {
                mostrarGantt();
            }
        }

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6">Error al cargar los datos</td>
            </tr>
        `;

        actualizarInfoPaginacionProductos(0, 0, 0);
        renderNumerosPaginacionProductos(1);
    }
}


/* =========================
   FILTRAR PRODUCTOS
========================= */
function filtrarProductos(){
    const buscador = document.getElementById("buscadorProductos");
    const filtroFecha = document.getElementById("filtroFechaProductos");

    if(!buscador || !filtroFecha) return;

    const busqueda = buscador.value.toLowerCase().trim();
    const fecha = filtroFecha.value;

    const filas = document.querySelectorAll("#tablaProductos tbody tr");

    filas.forEach(fila => {
        const celdas = fila.querySelectorAll("td");

        if(celdas.length < 5) return;

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

        fila.dataset.visible = coincideBusqueda && coincideFecha ? "true" : "false";
    });

    paginaActualProductos = 1;
    aplicarPaginacionProductos();
}


/* =========================
   ORDENAR PRODUCTOS
========================= */
function ordenarProductos(){
    const tbody = document.querySelector("#tablaProductos tbody");
    const selectOrden = document.getElementById("ordenProductos");

    if(!tbody || !selectOrden) return;

    const filas = Array.from(tbody.querySelectorAll("tr"));

    if(filas.length <= 1){
        aplicarPaginacionProductos();
        return;
    }

    const orden = selectOrden.value;

    filas.sort((a, b) => {
        const productoA = a.children[0]?.innerText.toLowerCase() || "";
        const productoB = b.children[0]?.innerText.toLowerCase() || "";

        const fechaA = new Date(a.children[4]?.innerText || "");
        const fechaB = new Date(b.children[4]?.innerText || "");

        if(orden === "recientes") return fechaB - fechaA;
        if(orden === "antiguos") return fechaA - fechaB;
        if(orden === "az") return productoA.localeCompare(productoB);
        if(orden === "za") return productoB.localeCompare(productoA);

        return 0;
    });

    filas.forEach(fila => tbody.appendChild(fila));

    filtrarProductos();
}


/* =========================
   PAGINACIÓN PRODUCTOS
========================= */
function obtenerFilasVisiblesProductos(){
    const filas = Array.from(document.querySelectorAll("#tablaProductos tbody tr"));

    return filas.filter(fila => fila.dataset.visible !== "false");
}

function aplicarPaginacionProductos(){
    const filas = Array.from(document.querySelectorAll("#tablaProductos tbody tr"));
    const visibles = obtenerFilasVisiblesProductos();

    const totalProductos = visibles.length;
    const totalPaginas = Math.ceil(totalProductos / productosPorPagina) || 1;

    if(paginaActualProductos > totalPaginas){
        paginaActualProductos = totalPaginas;
    }

    if(paginaActualProductos < 1){
        paginaActualProductos = 1;
    }

    const inicio = (paginaActualProductos - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;

    filas.forEach(fila => {
        fila.style.display = "none";
    });

    visibles.forEach((fila, index) => {
        fila.style.display = index >= inicio && index < fin ? "" : "none";
    });

    actualizarInfoPaginacionProductos(totalProductos, inicio, fin);
    renderNumerosPaginacionProductos(totalPaginas);
}

function actualizarInfoPaginacionProductos(total, inicio, fin){
    const info = document.getElementById("infoPaginacionProductos");

    if(!info) return;

    if(total === 0){
        info.textContent = "Mostrando 0 de 0 productos";
        return;
    }

    const desde = inicio + 1;
    const hasta = Math.min(fin, total);

    info.textContent = `Mostrando ${desde} a ${hasta} de ${total} productos`;
}

function renderNumerosPaginacionProductos(totalPaginas){
    const contenedor = document.getElementById("numerosPaginacionProductos");

    if(!contenedor) return;

    contenedor.innerHTML = "";

    for(let i = 1; i <= totalPaginas; i++){
        if(totalPaginas > 4 && i === 4 && paginaActualProductos < totalPaginas - 1){
            const puntos = document.createElement("span");
            puntos.className = "puntos-paginacion";
            puntos.textContent = "...";
            contenedor.appendChild(puntos);
            i = totalPaginas - 1;
        }

        const boton = document.createElement("button");
        boton.textContent = i;

        if(i === paginaActualProductos){
            boton.classList.add("activo");
        }

        boton.onclick = () => {
            paginaActualProductos = i;
            aplicarPaginacionProductos();
        };

        contenedor.appendChild(boton);
    }
}

function cambiarPaginaProductos(direccion){
    const visibles = obtenerFilasVisiblesProductos();
    const totalPaginas = Math.ceil(visibles.length / productosPorPagina) || 1;

    paginaActualProductos += direccion;

    if(paginaActualProductos < 1){
        paginaActualProductos = 1;
    }

    if(paginaActualProductos > totalPaginas){
        paginaActualProductos = totalPaginas;
    }

    aplicarPaginacionProductos();
}


/* =========================
   LIMPIAR FILTROS PRODUCTOS
========================= */
function limpiarFiltrosProductos(){
    const buscador = document.getElementById("buscadorProductos");
    const filtroFecha = document.getElementById("filtroFechaProductos");
    const orden = document.getElementById("ordenProductos");

    if(buscador) buscador.value = "";
    if(filtroFecha) filtroFecha.value = "";
    if(orden) orden.value = "recientes";

    paginaActualProductos = 1;
    ordenarProductos();
}


/* =========================
   EDITAR PRODUCTO
========================= */
function editarProducto(id) {
    localStorage.setItem("editandoId", id);

    showSection("monitoreo");

    cargarProductoParaEditar(id);
}


/* =========================
   CARGAR DATOS AL FORMULARIO
========================= */
async function cargarProductoParaEditar(id) {
    try {
        const response = await fetch("php/obtener_produccion.php");
        const data = await response.json();

        const item = data.data.find(p => p.id == id);

        if (!item) {
            alert("No se encontró el registro");
            return;
        }

        document.getElementById("pedido").value = item.numero_pedido || "";
        document.getElementById("Codigo").value = item.codigo || "";
        document.getElementById("Producto").value = item.producto || "";
        document.getElementById("cantidadProductos").value = item.cantidad || 1;
        document.getElementById("fecha").value = item.fecha || "";
        document.getElementById("dias").value = item.dias || "";
        document.getElementById("salida").textContent = item.salida || "--";
        document.getElementById("grupo").value = item.grupo || "1";

        const fechaFin = document.getElementById("fechaFin");
        if (fechaFin) fechaFin.value = item.fecha_fin || "";

        const fechaFinVisual = document.getElementById("fechaFinVisual");
        if (fechaFinVisual && item.fecha_fin) {
            const partes = item.fecha_fin.split("-");
            fechaFinVisual.value = `${partes[2]}/${partes[1]}/${partes[0]}`;
        } else if (fechaFinVisual) {
            fechaFinVisual.value = "";
        }

        const trabajaSabado = document.getElementById("trabajaSabado");
        if (trabajaSabado) trabajaSabado.value = item.trabaja_sabado || "no";

        /* =========================
           CARGAR SITUACION / EXTRA
        ========================= */
        const totalMinutosSituacion = parseInt(item.tiempo_muerto) || 0;

        const situacionHoras = document.getElementById("situacionHoras");
        const situacionMinutos = document.getElementById("situacionMinutos");
        const situacionDescripcion = document.getElementById("situacionDescripcion");

        if (situacionHoras) situacionHoras.value = Math.floor(totalMinutosSituacion / 60);
        if (situacionMinutos) situacionMinutos.value = totalMinutosSituacion % 60;
        if (situacionDescripcion) situacionDescripcion.value = item.situacion_descripcion || "";

        const modalHoras = document.getElementById("modalSituacionHoras");
        const modalMinutos = document.getElementById("modalSituacionMinutos");
        const modalDescripcion = document.getElementById("modalSituacionDescripcion");

        if (modalHoras) modalHoras.value = Math.floor(totalMinutosSituacion / 60);
        if (modalMinutos) modalMinutos.value = totalMinutosSituacion % 60;
        if (modalDescripcion) modalDescripcion.value = item.situacion_descripcion || "";

        /* =========================
           CARGAR FALLO MAQUINA
        ========================= */
        const falloMaquina = document.getElementById("falloMaquina");
        const maquinaFallo = document.getElementById("maquinaFallo");

        if (falloMaquina) {
            falloMaquina.value = item.fallo_maquina || "no";
        }

        if (maquinaFallo) {
            if (item.fallo_maquina === "si") {
                maquinaFallo.style.display = "block";
                maquinaFallo.value = item.maquina_fallo || "";
            } else {
                maquinaFallo.style.display = "none";
                maquinaFallo.value = "";
            }
        }

        /* =========================
           CARGAR MAQUINAS
        ========================= */
        document
            .querySelectorAll("#tablaOriente tbody tr, #tablaPoniente tbody tr")
            .forEach(f => {
                const uso = f.querySelector(".uso");
                const horas = f.querySelector(".horas");
                const minutos = f.querySelector(".minutos");

                if (uso) uso.value = "no";
                if (horas) horas.value = 0;
                if (minutos) minutos.value = 0;

                actualizarColorFila(f);
            });

        const resMaquinas = await fetch(`php/obtener_maquinas_produccion.php?id=${id}`);
        const dataMaquinas = await resMaquinas.json();

        if (dataMaquinas.success) {
            dataMaquinas.data.forEach(m => {
                const filas = document.querySelectorAll("#tablaOriente tbody tr, #tablaPoniente tbody tr");

                filas.forEach(f => {
                    const zona = f.getAttribute("data-zona");
                    const maquina = f.getAttribute("data-maquina");

                    if (zona === m.zona && maquina === m.maquina) {
                        const uso = f.querySelector(".uso");
                        const horas = f.querySelector(".horas");
                        const minutos = f.querySelector(".minutos");

                        if (uso) uso.value = m.uso || "no";
                        if (horas) horas.value = parseInt(m.horas) || 0;
                        if (minutos) minutos.value = parseInt(m.minutos) || 0;

                        actualizarColorFila(f);
                    }
                });
            });
        }

        localStorage.setItem("editandoId", id);

        calcular();

        if (typeof showSection === "function") {
            showSection("monitoreo");
        }

    } catch (error) {
        console.error(error);
        alert("Error cargando datos para edición");
    }
}


/* =========================
   ELIMINAR PRODUCTO
========================= */
async function eliminarProducto(id) {
    const confirmar = confirm("¿Deseas eliminar este registro?");
    if (!confirmar) return;

    try {
        const response = await fetch("php/eliminar_produccion.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });

        const data = await response.json();

        if (data.success) {
            alert("Registro eliminado correctamente");
            renderProductos();
        } else {
            alert(data.message || "No se pudo eliminar");
        }

    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor");
    }
}