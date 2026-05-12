/* =========================
   EDITAR PRODUCTO
========================= */
async function editarProducto(id) {
    localStorage.setItem("editandoId", id);

    if (typeof showSection === "function") {
        await showSection("monitoreo");
    }

    await cargarProductoParaEditar(id);
}
/* =========================
   LIMPIAR MÁQUINAS
========================= */
function limpiarMaquinasFormulario() {
    document
        .querySelectorAll("#tablaMaquinas tbody tr")
        .forEach(fila => {
            const uso = fila.querySelector(".uso");
            const horas = fila.querySelector(".horas");
            const minutos = fila.querySelector(".minutos");

            if (uso) uso.value = "no";
            if (horas) horas.value = 0;
            if (minutos) minutos.value = 0;

            const btnUso = fila.querySelector(
                '.custom-select-maquina[data-target-class="uso"] .custom-select-selected'
            );

            if (btnUso) {
                btnUso.innerHTML = `No <span class="select-circle-icon"></span>`;
            }

            const btnHoras = fila.querySelector(
                '.custom-select-maquina[data-target-class="horas"] .custom-select-selected'
            );

            if (btnHoras) {
                btnHoras.innerHTML = `0h <span class="select-circle-icon"></span>`;
            }

            const btnMinutos = fila.querySelector(
                '.custom-select-maquina[data-target-class="minutos"] .custom-select-selected'
            );

            if (btnMinutos) {
                btnMinutos.innerHTML = `0m <span class="select-circle-icon"></span>`;
            }

            actualizarColorFila(fila);
        });
}

/* =========================
   CARGAR MÁQUINAS GUARDADAS
========================= */
async function cargarMaquinasGuardadasProducto(id) {
    const resMaquinas = await fetch(`php/produccion/obtener_maquinas_produccion.php?id=${id}`);
    const dataMaquinas = await resMaquinas.json();

    console.log("MAQUINAS CARGADAS:", dataMaquinas);

    if (!dataMaquinas.success || !Array.isArray(dataMaquinas.data)) return;

    const filas = document.querySelectorAll("#tablaMaquinas tbody tr");

    dataMaquinas.data.forEach(m => {
        filas.forEach(fila => {
            const idFila = fila.getAttribute("data-id-maquina");
            const idGuardado = m.id_maquina;

            if (idFila && idGuardado && String(idFila) === String(idGuardado)) {
                const uso = fila.querySelector(".uso");
                const horas = fila.querySelector(".horas");
                const minutos = fila.querySelector(".minutos");

                if (uso) {
                    uso.value = m.uso || "no";

                    const customSelect = fila.querySelector(".custom-select-selected");

                    if (customSelect) {
                        customSelect.innerHTML =
                            uso.value === "si"
                                ? `Sí <span class="select-circle-icon"></span>`
                                : `No <span class="select-circle-icon"></span>`;
                    }
                }

                const horasValor = parseInt(m.horas) || 0;
                const minutosValor = parseInt(m.minutos) || 0;

                if (horas) {
                    horas.value = horasValor;

                    const wrapperHoras = horas.parentElement.querySelector(
                        '[data-target-class="horas"]'
                    );

                    const btnHoras = wrapperHoras?.querySelector(".custom-select-selected");

                    if (btnHoras) {
                        btnHoras.innerHTML =
                            `${horasValor}h <span class="select-circle-icon"></span>`;
                    }
                }

                if (minutos) {
                    minutos.value = minutosValor;

                    const wrapperMinutos = minutos.parentElement.querySelector(
                        '[data-target-class="minutos"]'
                    );

                    const btnMinutos = wrapperMinutos?.querySelector(".custom-select-selected");

                    if (btnMinutos) {
                        btnMinutos.innerHTML =
                            `${minutosValor}m <span class="select-circle-icon"></span>`;
                    }
                }

                actualizarColorFila(fila);
            }
        });
    });
}

/* =========================
   CARGAR DATOS AL FORMULARIO
========================= */
async function cargarProductoParaEditar(id) {
    try {
    const response = await fetch(`php/produccion/obtener_produccion.php`);
    const data = await response.json();

    if (!data.success || !Array.isArray(data.data)) {
        alert(data.message || "No se pudo obtener la producción");
        return;
    }

const item = data.data.find(p => String(p.id) === String(id));

        if (!item) {
            alert("No se encontró el registro");
            return;
        }

        const partesPedido = (item.numero_pedido || "").split("-");

        document.getElementById("pedido").value = partesPedido[0] || "";

        const otInput = document.getElementById("ot");
        if (otInput) otInput.value = partesPedido[1] || "";

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
        if (trabajaSabado) {
            trabajaSabado.value = item.trabaja_sabado || "no";
        }

        const totalMinutosSituacion = parseInt(item.tiempo_muerto) || 0;

        const situacionHoras = document.getElementById("situacionHoras");
        const situacionMinutos = document.getElementById("situacionMinutos");
        const situacionDescripcion = document.getElementById("situacionDescripcion");

        if (situacionHoras) situacionHoras.value = Math.floor(totalMinutosSituacion / 60);
        if (situacionMinutos) situacionMinutos.value = totalMinutosSituacion % 60;
        if (situacionDescripcion) {
            situacionDescripcion.value = item.situacion_descripcion || "";
        }

        const modalHoras = document.getElementById("modalSituacionHoras");
        const modalMinutos = document.getElementById("modalSituacionMinutos");
        const modalDescripcion = document.getElementById("modalSituacionDescripcion");

        if (modalHoras) modalHoras.value = Math.floor(totalMinutosSituacion / 60);
        if (modalMinutos) modalMinutos.value = totalMinutosSituacion % 60;
        if (modalDescripcion) {
            modalDescripcion.value = item.situacion_descripcion || "";
        }

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

        setTimeout(async () => {
            limpiarMaquinasFormulario();

            await cargarMaquinasGuardadasProducto(id);

            if (typeof calcular === "function") {
                calcular();
            }
        }, 500);

        localStorage.setItem("editandoId", id);

    } catch (error) {
        console.error(error);
        alert("Error cargando datos para edición");
    }
}

window.editarProducto = editarProducto;
window.cargarProductoParaEditar = cargarProductoParaEditar;