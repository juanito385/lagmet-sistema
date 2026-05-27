/* =========================
   HORAS / MINUTOS
========================= */
function horas() {
    let op = "";

    for (let i = 0; i <= 10; i++) {
        op += `<option value="${i}">${i}h</option>`;
    }

    return op;
}

function minutos() {
    let op = "";

    for (let i = 0; i < 60; i += 5) {
        op += `<option value="${i}">${i}m</option>`;
    }

    return op;
}

function generarOpcionesHorasCustom() {
    let opciones = "";

    for (let i = 0; i <= 10; i++) {
        opciones += `
            <button type="button" data-value="${i}">
                ${i}h
            </button>
        `;
    }

    return opciones;
}

function generarOpcionesMinutosCustom() {
    let opciones = "";

    for (let i = 0; i < 60; i += 5) {
        opciones += `
            <button type="button" data-value="${i}">
                ${i}m
            </button>
        `;
    }

    return opciones;
}

/* =========================
   CREAR TABLA MAQUINAS
========================= */
function crearTablaMaquinas(lista) {

    const tbody = document.querySelector("#tablaMaquinas tbody");
    const totalMaquinas = document.getElementById("totalMaquinas");

    if (!tbody) return;

    tbody.innerHTML = "";

    lista.forEach((maquina, index) => {

        const zona = (maquina.zona || "").toLowerCase();
        const bloqueada = Number(maquina.bloqueada) === 1;
        const estadoTexto = maquina.estado_texto || "Operativa";

        const fila = document.createElement("tr");

        fila.setAttribute("data-zona", zona);
        fila.setAttribute("data-maquina", maquina.nombre_maquina);
        fila.setAttribute("data-id-maquina", maquina.id);
        fila.setAttribute("data-bloqueada", bloqueada ? "si" : "no");

        fila.innerHTML = `
            <td>${index + 1}</td>

            <td>
                <div class="maquina-nombre-monitor">
                    ${bloqueada ? `<span class="maquina-lock">🔒</span>` : ""}
                    <span>${maquina.nombre_maquina}</span>
                </div>

                ${
                    bloqueada
                        ? `<small class="maquina-bloqueada-texto">${estadoTexto} - Bloqueada</small>`
                        : `<small class="maquina-disponible-texto">Operativa - Disponible</small>`
                }
            </td>

            <td>
                <span class="badge-zona ${zona}">
                    ${maquina.zona}
                </span>
            </td>

            <td>
                <input type="hidden" class="uso" value="no">

                <div class="custom-select-monitor custom-select-maquina ${bloqueada ? "select-maquina-bloqueada" : ""}" data-target-class="uso">

                    <button 
                        type="button" 
                        class="custom-select-selected"
                        ${bloqueada ? "disabled" : ""}
                        title="${bloqueada ? estadoTexto + ' - No disponible en Monitoreo' : ''}">
                        ${bloqueada ? "Bloqueada" : "No"}
                        <span></span>
                    </button>

                    <div class="custom-select-options">
                        <button type="button" data-value="no">No</button>
                        ${
                            bloqueada
                                ? ""
                                : `<button type="button" data-value="si">Sí</button>`
                        }
                    </div>

                </div>
            </td>

            <td>
                <div class="tiempo-maquina ${bloqueada ? "tiempo-maquina-bloqueada" : ""}">

                    <input type="hidden" class="horas" value="0">
                    <input type="hidden" class="minutos" value="0">

                    <div class="custom-select-monitor custom-select-maquina custom-tiempo" data-target-class="horas">

                        <button 
                            type="button" 
                            class="custom-select-selected"
                            ${bloqueada ? "disabled" : ""}>
                            0h
                            <span></span>
                        </button>

                        <div class="custom-select-options custom-options-small">
                            ${bloqueada ? "" : generarOpcionesHorasCustom()}
                        </div>

                    </div>

                    <div class="custom-select-monitor custom-select-maquina custom-tiempo" data-target-class="minutos">

                        <button 
                            type="button" 
                            class="custom-select-selected"
                            ${bloqueada ? "disabled" : ""}>
                            0m
                            <span></span>
                        </button>

                        <div class="custom-select-options custom-options-small">
                            ${bloqueada ? "" : generarOpcionesMinutosCustom()}
                        </div>

                    </div>

                </div>
            </td>
        `;

        if (bloqueada) {
            fila.classList.add("maquina-bloqueada");
        } else {
            fila.classList.add("maquina-inactiva");
        }

        tbody.appendChild(fila);
    });

    if (totalMaquinas) {
        totalMaquinas.textContent = lista.length;
    }

    cargarSelectFalloMaquina(lista);

    actualizarColorTodasLasFilas();

    aplicarFiltrosMaquinas();

    calcular();
}

/* =========================
   CARGAR MAQUINAS BD
========================= */
async function cargarMaquinasDesdeBD() {

    try {

        const res = await fetch("/proyecto_lagmet/php/maquinas/obtener_maquinas.php");

        const data = await res.json();

        if (!data.success) {
            console.error(data.message);
            return;
        }

        maquinasBD = data.data;

        crearTablaMaquinas(maquinasBD);

    } catch (error) {

        console.error(
            "Error cargando máquinas desde BD:",
            error
        );
    }
}

/* =========================
   SELECT FALLO MAQUINA
========================= */
function cargarSelectFalloMaquina(lista) {

    const opciones = document.getElementById("opcionesMaquinaFallo");

    if (!opciones) return;

    opciones.innerHTML = "";

    const placeholder = document.createElement("button");

    placeholder.type = "button";
    placeholder.dataset.value = "";
    placeholder.textContent = "Seleccionar máquina";

    opciones.appendChild(placeholder);

    lista.forEach(m => {

        const option = document.createElement("button");

        option.type = "button";
        option.dataset.value = m.nombre_maquina;
        option.textContent = m.nombre_maquina;

        opciones.appendChild(option);
    });
}

/* =========================
   FILTROS MAQUINAS
========================= */
function aplicarFiltrosMaquinas() {

    const busqueda =
        document.getElementById("buscarMaquina")
        ?.value
        .toLowerCase()
        .trim() || "";

    const filtroUso =
        document.getElementById("filtroUsoMaquinas")
        ?.value || "todas";

    document
        .querySelectorAll("#tablaMaquinas tbody tr")
        .forEach(fila => {

            const zona =
                fila.getAttribute("data-zona") || "";

            const maquina =
                (fila.getAttribute("data-maquina") || "")
                .toLowerCase();

            const uso =
                fila.querySelector(".uso")?.value || "no";

            const coincideZona =
                filtroZonaActual === "todas" ||
                zona === filtroZonaActual;

            const coincideUso =
                filtroUso === "todas" ||
                uso === filtroUso;

            const coincideBusqueda =
                maquina.includes(busqueda);

            fila.style.display =
                coincideZona &&
                coincideUso &&
                coincideBusqueda
                    ? ""
                    : "none";
        });
}

/* =========================
   ORDEN PROCESO MAQUINAS
========================= */
function obtenerSiguienteOrdenProceso() {

    const ordenes = Array
        .from(document.querySelectorAll("#tablaMaquinas tbody tr"))
        .map(fila => parseInt(fila.dataset.ordenProceso || "0"))
        .filter(orden => !isNaN(orden) && orden > 0);

    if (!ordenes.length) {
        return 1;
    }

    return Math.max(...ordenes) + 1;
}

function normalizarOrdenProcesoMaquinas() {

    const filasActivas = Array
        .from(document.querySelectorAll("#tablaMaquinas tbody tr"))
        .filter(fila => fila.querySelector(".uso")?.value === "si")
        .sort((a, b) => {
            const ordenA = parseInt(a.dataset.ordenProceso || "0");
            const ordenB = parseInt(b.dataset.ordenProceso || "0");

            return ordenA - ordenB;
        });

    filasActivas.forEach((fila, index) => {
        fila.dataset.ordenProceso = index + 1;
    });
}

/* =========================
   COLOR FILAS
========================= */
function actualizarColorFila(fila) {

    const uso = fila.querySelector(".uso");

    if (!uso) return;

    fila.classList.remove(
        "maquina-activa",
        "maquina-inactiva",
        "si",
        "no"
    );

    if (uso.value === "si") {

        fila.classList.add("maquina-activa");

        if (!fila.dataset.ordenProceso) {
            fila.dataset.ordenProceso = obtenerSiguienteOrdenProceso();
        }

    } else {

        fila.classList.add("maquina-inactiva");

        if (fila.dataset.ordenProceso) {
            delete fila.dataset.ordenProceso;
            normalizarOrdenProcesoMaquinas();
        }
    }
}

function actualizarColorTodasLasFilas() {

    document
        .querySelectorAll("#tablaMaquinas tbody tr")
        .forEach(fila => actualizarColorFila(fila));
}