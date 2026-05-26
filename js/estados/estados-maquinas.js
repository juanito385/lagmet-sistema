/* =====================================================
   ESTADOS - MÁQUINAS
===================================================== */


/* =========================
   INICIAR MÁQUINAS
========================= */
function iniciarEstadosMaquinas() {
    cargarEstadosMaquinas();

    const btnFiltrar = document.getElementById("btnFiltrarEstadosMaquinas");

    if (btnFiltrar && btnFiltrar.dataset.eventoAsignado !== "true") {
        btnFiltrar.dataset.eventoAsignado = "true";

        btnFiltrar.addEventListener("click", () => {
            paginaActualEstadosMaquinas = 1;
            cargarEstadosMaquinas();
        });
    }

    const btnGuardar = document.getElementById("btnGuardarEstadoMaquina");

    if (btnGuardar && btnGuardar.dataset.eventoAsignado !== "true") {
        btnGuardar.dataset.eventoAsignado = "true";

        btnGuardar.addEventListener("click", guardarEstadoMaquina);
    }
    }

/* =========================
   CARGAR MÁQUINAS DESDE BD
========================= */
async function cargarEstadosMaquinas(pagina = paginaActualEstadosMaquinas) {
    const tabla = document.getElementById("tablaEstadosMaquinas");
    const resumenTexto = document.getElementById("resumenEstadosMaquinas");

    if (!tabla) return;

    const tieneFilas = tabla.children.length > 0;

    if (!tieneFilas) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7">Cargando máquinas...</td>
            </tr>
        `;
    } else {
        tabla.classList.add("tabla-cargando-suave");
    }

    try {
        const buscar = document.getElementById("filtroMaquinaBuscar")?.value.trim() || "";
        const estado = document.getElementById("filtroMaquinaEstado")?.value || "todos";
        const zona = document.getElementById("filtroMaquinaZona")?.value || "todas";

        const url = `php/maquinas/obtener_estado_maquinas.php?buscar=${encodeURIComponent(buscar)}&estado=${encodeURIComponent(estado)}&zona=${encodeURIComponent(zona)}&pagina=${pagina}&limite=${limiteEstadosMaquinas}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="7">Error al cargar máquinas</td>
                </tr>
            `;
            console.error(data);
            return;
        }

        paginaActualEstadosMaquinas = data.paginacion.pagina;
        maquinasEstadosActuales = data.data;

        renderResumenEstadosMaquinas(data.resumen);
        renderTablaEstadosMaquinas(data.data);
        renderPaginacionEstadosMaquinas(data.paginacion);

        if (resumenTexto) {
            const total = data.paginacion.total_filtrado;
            const inicio = total === 0 ? 0 : ((data.paginacion.pagina - 1) * data.paginacion.limite) + 1;
            const fin = Math.min(data.paginacion.pagina * data.paginacion.limite, total);

            resumenTexto.textContent = `Mostrando ${inicio} a ${fin} de ${total} máquinas`;
        }

    } catch (error) {
        console.error("Error cargando máquinas:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="7">Error de conexión al cargar máquinas</td>
            </tr>
        `;
    }

    tabla.classList.remove("tabla-cargando-suave");
}

/* =========================
   RENDER TARJETAS RESUMEN
========================= */
function renderResumenEstadosMaquinas(resumen) {
    const operativas = document.getElementById("estadoMaquinasOperativas");
    const noOperativas = document.getElementById("estadoMaquinasNoOperativas");
    const mantencion = document.getElementById("estadoMaquinasMantencion");

    if (operativas) operativas.textContent = resumen.operativas;
    if (noOperativas) noOperativas.textContent = resumen.no_operativas;
    if (mantencion) mantencion.textContent = resumen.mantencion;

    const porcentajeOperativas = document.querySelector(".maquina-operativa small");
    const porcentajeNoOperativas = document.querySelector(".maquina-no-operativa small");
    const porcentajeMantencion = document.querySelector(".maquina-mantencion small");

    if (porcentajeOperativas) {
        porcentajeOperativas.textContent = `${resumen.porcentaje_operativas}% del total`;
    }

    if (porcentajeNoOperativas) {
        porcentajeNoOperativas.textContent = `${resumen.porcentaje_no_operativas}% del total`;
    }

    if (porcentajeMantencion) {
        porcentajeMantencion.textContent = `${resumen.porcentaje_mantencion}% del total`;
    }
}
/* =========================
   RENDER TABLA
========================= */
function renderTablaEstadosMaquinas(maquinas) {
    const tabla = document.getElementById("tablaEstadosMaquinas");

    if (!tabla) return;

    if (!maquinas || maquinas.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="7">No se encontraron máquinas</td>
            </tr>
        `;
        return;
    }

    tabla.innerHTML = maquinas.map(maquina => {
        const estadoTexto = obtenerTextoEstadoMaquina(maquina.estado);
        const claseEstado = obtenerClaseEstadoMaquina(maquina.estado);

        const disponible = maquina.estado === "Si";

        const disponibilidadTexto = disponible
            ? `<span class="estado-disponible">✓ Disponible</span>`
            : `<span class="estado-bloqueada">🔒 Bloqueada en formulario</span>`;

        const motivo = maquina.observacion && maquina.observacion.trim() !== ""
            ? maquina.observacion
            : "—";

        const actualizadoPor = maquina.actualizado_por || "Admin";
        const fecha = formatearFechaEstadoMaquina(maquina.fecha_actualizacion);

        return `
            <tr>
                <td>${maquina.nombre_maquina}</td>
                <td>${maquina.zona}</td>
                <td>
                    <span class="${claseEstado}">${estadoTexto}</span>
                </td>
                <td>${disponibilidadTexto}</td>
                <td>${motivo}</td>
                <td>
                    ${fecha}<br>
                    <small>${actualizadoPor}</small>
                </td>
                <td>
                    <button 
                        type="button" 
                        class="btn-editar-maquina"
                        onclick="abrirModalEditarMaquina(${maquina.id})">
                        ✎
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

/* =========================
   RENDER PAGINACIÓN
========================= */
function renderPaginacionEstadosMaquinas(paginacion) {
    const contenedor = document.getElementById("paginacionEstadosMaquinas");

    if (!contenedor) return;

    const totalPaginas = paginacion.total_paginas;

    if (totalPaginas <= 1) {
        contenedor.innerHTML = "";
        return;
    }

    let html = "";

    html += `
        <button 
            type="button" 
            ${paginacion.pagina <= 1 ? "disabled" : ""}
            onclick="cambiarPaginaEstadosMaquinas(${paginacion.pagina - 1})">
            ‹
        </button>
    `;

    for (let i = 1; i <= totalPaginas; i++) {
        html += `
            <button 
                type="button" 
                class="${i === paginacion.pagina ? "active" : ""}"
                onclick="cambiarPaginaEstadosMaquinas(${i})">
                ${i}
            </button>
        `;
    }

    html += `
        <button 
            type="button" 
            ${paginacion.pagina >= totalPaginas ? "disabled" : ""}
            onclick="cambiarPaginaEstadosMaquinas(${paginacion.pagina + 1})">
            ›
        </button>
    `;

    contenedor.innerHTML = html;
}

/* =========================
   CAMBIAR PÁGINA
========================= */
function cambiarPaginaEstadosMaquinas(pagina) {
    paginaActualEstadosMaquinas = pagina;
    cargarEstadosMaquinas(pagina);
}

/* =========================
   HELPERS
========================= */
function obtenerTextoEstadoMaquina(estado) {
    if (estado === "Si") return "Operativa";
    if (estado === "No") return "No operativa";
    if (estado === "Mantencion") return "En mantención";
    return "Sin estado";
}

function obtenerClaseEstadoMaquina(estado) {
    if (estado === "Si") return "estado-badge estado-badge-operativa";
    if (estado === "No") return "estado-badge estado-badge-no-operativa";
    if (estado === "Mantencion") return "estado-badge estado-badge-mantencion";
    return "estado-badge";
}

function formatearFechaEstadoMaquina(fechaMysql) {
    if (!fechaMysql) return "—";

    const fecha = new Date(fechaMysql.replace(" ", "T"));

    if (isNaN(fecha.getTime())) {
        return fechaMysql;
    }

    return fecha.toLocaleString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* =========================
   TEMPORAL
   Luego la haremos funcional
========================= */
function abrirModalEditarMaquina(id) {
    const maquina = maquinasEstadosActuales.find(item => Number(item.id) === Number(id));

    if (!maquina) {
        console.error("No se encontró la máquina con ID:", id);
        alert("No se encontró la máquina seleccionada.");
        return;
    }

    const overlay = document.getElementById("modalMaquinaOverlay");

    const inputId = document.getElementById("modalMaquinaId");
    const inputNombre = document.getElementById("modalMaquinaNombre");
    const inputZona = document.getElementById("modalMaquinaZona");
    const selectEstado = document.getElementById("modalMaquinaEstado");
    const textareaObservacion = document.getElementById("modalMaquinaObservacion");
    const inputActualizadoPor = document.getElementById("modalMaquinaActualizadoPor");

    if (!overlay) {
        console.error("No existe el modalMaquinaOverlay en el HTML.");
        return;
    }

    inputId.value = maquina.id;
    inputNombre.value = maquina.nombre_maquina || "";
    inputZona.value = maquina.zona || "";
    selectEstado.value = maquina.estado || "Si";
    textareaObservacion.value = maquina.observacion || "";
    inputActualizadoPor.value = maquina.actualizado_por || "Admin";

    overlay.style.display = "flex";
}

function cerrarModalEditarMaquina() {
    const overlay = document.getElementById("modalMaquinaOverlay");

    if (overlay) {
        overlay.style.display = "none";
    }
}

async function guardarEstadoMaquina() {
    const id = document.getElementById("modalMaquinaId")?.value;
    const estado = document.getElementById("modalMaquinaEstado")?.value;
    const observacion = document.getElementById("modalMaquinaObservacion")?.value.trim() || "";
    const actualizadoPor = document.getElementById("modalMaquinaActualizadoPor")?.value.trim() || "Admin";

    const btnGuardar = document.getElementById("btnGuardarEstadoMaquina");

    if (!id) {
        alert("No se encontró el ID de la máquina.");
        return;
    }

    if (!estado) {
        alert("Debes seleccionar un estado.");
        return;
    }

    try {
        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.textContent = "Guardando...";
        }

        const response = await fetch("php/maquinas/actualizar_estado_maquina.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: id,
                estado: estado,
                observacion: observacion,
                actualizado_por: actualizadoPor
            })
        });

        const data = await response.json();

        if (!data.success) {
            console.error(data);
            alert(data.message || "No se pudo actualizar la máquina.");
            return;
        }

        cerrarModalEditarMaquina();

        await cargarEstadosMaquinas(paginaActualEstadosMaquinas);

    } catch (error) {
        console.error("Error guardando estado de máquina:", error);
        alert("Error de conexión al guardar el estado de la máquina.");

    } finally {
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar cambios";
        }
    }
}
