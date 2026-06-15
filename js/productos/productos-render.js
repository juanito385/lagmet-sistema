/* =========================
   RENDER PRODUCTOS
========================= */
async function renderProductos() {
    const tbody = document.querySelector("#tablaProductos tbody");
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="9">Cargando datos...</td>
        </tr>
    `;

    try {
        const response = await fetch("php/produccion/obtener_produccion.php");
        const data = await response.json();

        if (!data.success || !data.data.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9">No hay productos registrados</td>
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

            const estado = obtenerEstadoRealProducto(
                item.estado_actual || item.estado_real || item.estado_bd
            );

            const tieneAlertaAtraso = productoTieneAlertaAtraso(item);

            fila.innerHTML = `
                <td>${item.producto ?? ""}</td>
                <td>${item.numero_pedido ?? ""}</td>
                <td>${item.codigo ?? ""}</td>
                <td>${item.cantidad ?? ""}</td>
                <td data-fecha="${fechaInicio}">${formatearFechaVisual(fechaInicio)}</td>
                <td data-fecha="${fechaFin}">${formatearFechaVisual(fechaFin)}</td>
                <td>${dias}</td>
                <td>
                    <div class="estado-producto-wrapper">
                        <span class="badge-estado ${estado.clase}">
                            ${estado.texto}
                        </span>

                        ${tieneAlertaAtraso ? `
                            <span 
                                class="material-icons estado-alerta-atraso"
                                data-tooltip="Fecha vencida o término fuera de plazo"
                                aria-label="Fecha vencida o término fuera de plazo"
                            >
                                warning_amber
                            </span>
                        ` : ""}
                    </div>
                </td>
                <td>
                    <div class="acciones-producto">
                        <button class="btn-action editar" onclick="editarProducto(${item.id})" title="Editar">
                            <span class="material-icons">edit</span>
                        </button>

                        <button 
                            class="btn-action eliminar" 
                            onclick="eliminarProducto(${item.id})" 
                            title="Eliminar"
                            data-permiso-modulo="productos"
                            data-permiso-accion="eliminar"
                        >
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </td>
            `;

            fila.dataset.visible = "true";
            tbody.appendChild(fila);
        });

        ordenarProductos();

        if (typeof aplicarPermisosAccionesIronix === "function") {
            aplicarPermisosAccionesIronix();
        }

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
                <td colspan="9">Error al cargar los datos</td>
            </tr>
        `;

        actualizarInfoPaginacionProductos(0, 0, 0);
        renderNumerosPaginacionProductos(1);
    }
}

window.renderProductos = renderProductos;