/* =========================
   JORNADA
========================= */
const inicioJornadaHora = 7;
const inicioJornadaMin = 30;
const finJornadaHora = 16;
const finJornadaMin = 45;

/* =========================
   VARIABLES GLOBALES
========================= */
let filtroZonaActual = "todas";
let maquinasBD = [];

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

/* =========================
   CREAR TABLA ÚNICA MÁQUINAS
========================= */
function crearTablaMaquinas(lista) {
    const tbody = document.querySelector("#tablaMaquinas tbody");
    const totalMaquinas = document.getElementById("totalMaquinas");

    if (!tbody) return;

    tbody.innerHTML = "";

    lista.forEach((maquina, index) => {
        const zona = (maquina.zona || "").toLowerCase();

        const fila = document.createElement("tr");

        fila.setAttribute("data-zona", zona);
        fila.setAttribute("data-maquina", maquina.nombre_maquina);
        fila.setAttribute("data-id-maquina", maquina.id);

        fila.innerHTML = `
            <td>${index + 1}</td>

            <td>${maquina.nombre_maquina}</td>

            <td>
                <span class="badge-zona ${zona}">
                    ${maquina.zona}
                </span>
            </td>

            <td>
                <select class="uso">
                    <option value="no">No</option>
                    <option value="si">Sí</option>
                </select>
            </td>

            <td>
                <div class="tiempo-maquina">
                    <select class="horas">${horas()}</select>
                    <select class="minutos">${minutos()}</select>
                </div>
            </td>
        `;

        fila.classList.add("maquina-inactiva");
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
   CARGAR MÁQUINAS DESDE BD
========================= */
async function cargarMaquinasDesdeBD() {
    try {
        const res = await fetch("php/obtener_maquinas.php");
        const data = await res.json();

        if (!data.success) {
            console.error(data.message);
            return;
        }

        maquinasBD = data.data;
        crearTablaMaquinas(maquinasBD);

    } catch (error) {
        console.error("Error cargando máquinas desde BD:", error);
    }
}

/* =========================
   SELECT FALLO MÁQUINA DINÁMICO
========================= */
function cargarSelectFalloMaquina(lista) {
    const select = document.getElementById("maquinaFallo");
    if (!select) return;

    select.innerHTML = `<option value="">Seleccionar máquina</option>`;

    const oriente = lista.filter(m => (m.zona || "").toLowerCase() === "oriente");
    const poniente = lista.filter(m => (m.zona || "").toLowerCase() === "poniente");

    if (oriente.length) {
        const grupoOriente = document.createElement("optgroup");
        grupoOriente.label = "Zona Oriente";

        oriente.forEach(m => {
            const option = document.createElement("option");
            option.value = m.nombre_maquina;
            option.textContent = m.nombre_maquina;
            grupoOriente.appendChild(option);
        });

        select.appendChild(grupoOriente);
    }

    if (poniente.length) {
        const grupoPoniente = document.createElement("optgroup");
        grupoPoniente.label = "Zona Poniente";

        poniente.forEach(m => {
            const option = document.createElement("option");
            option.value = m.nombre_maquina;
            option.textContent = m.nombre_maquina;
            grupoPoniente.appendChild(option);
        });

        select.appendChild(grupoPoniente);
    }
}

/* =========================
   FILTROS MÁQUINAS
========================= */
function aplicarFiltrosMaquinas() {
    const busqueda = document.getElementById("buscarMaquina")?.value.toLowerCase().trim() || "";
    const filtroUso = document.getElementById("filtroUsoMaquinas")?.value || "todas";

    document.querySelectorAll("#tablaMaquinas tbody tr").forEach(fila => {
        const zona = fila.getAttribute("data-zona") || "";
        const maquina = (fila.getAttribute("data-maquina") || "").toLowerCase();
        const uso = fila.querySelector(".uso")?.value || "no";

        const coincideZona = filtroZonaActual === "todas" || zona === filtroZonaActual;
        const coincideUso = filtroUso === "todas" || uso === filtroUso;
        const coincideBusqueda = maquina.includes(busqueda);

        fila.style.display = coincideZona && coincideUso && coincideBusqueda ? "" : "none";
    });
}

/* =========================
   COLOR FILAS MÁQUINAS
========================= */
function actualizarColorFila(fila) {
    const uso = fila.querySelector(".uso");

    if (!uso) return;

    fila.classList.remove("maquina-activa", "maquina-inactiva", "si", "no");

    if (uso.value === "si") {
        fila.classList.add("maquina-activa");
    } else {
        fila.classList.add("maquina-inactiva");
    }
}

function actualizarColorTodasLasFilas() {
    document
        .querySelectorAll("#tablaMaquinas tbody tr")
        .forEach(fila => actualizarColorFila(fila));
}

/* =========================
   FORMATO HORA AM/PM
========================= */
function formatearHoraAMPM(fecha) {
    return fecha.toLocaleTimeString("es-CL", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).toUpperCase();
}

/* =========================
   CÁLCULO
========================= */
function calcular() {
    let total = 0;

    const filas = document.querySelectorAll("#tablaMaquinas tbody tr");

    filas.forEach(fila => {
        const uso = fila.querySelector(".uso");
        const h = fila.querySelector(".horas");
        const m = fila.querySelector(".minutos");

        if (uso && h && m && uso.value === "si") {
            total += parseFloat(h.value) + (parseInt(m.value) / 60);
        }
    });

    const cantidad = parseInt(document.getElementById("cantidadProductos")?.value) || 1;
    total *= cantidad;

    const situacionHoras = parseInt(document.getElementById("situacionHoras")?.value) || 0;
    const situacionMinutos = parseInt(document.getElementById("situacionMinutos")?.value) || 0;

    total += situacionHoras + (situacionMinutos / 60);

    const salidaEl = document.getElementById("salida");
    const diasEl = document.getElementById("dias");
    const grupo = document.getElementById("grupo")?.value;
    const trabajaSabado = document.getElementById("trabajaSabado")?.value || "no";
    const fechaInicioInput = document.getElementById("fecha")?.value;

    if (!salidaEl || !diasEl) return;

    if (total === 0 || !fechaInicioInput) {
        salidaEl.textContent = "--";
        diasEl.value = "";

        const fechaFinInput = document.getElementById("fechaFin");
        const fechaFinVisual = document.getElementById("fechaFinVisual");

        if (fechaFinInput) fechaFinInput.value = "";
        if (fechaFinVisual) fechaFinVisual.value = "";

        return;
    }

    let ahora = new Date(fechaInicioInput + "T00:00:00");
    ahora.setHours(inicioJornadaHora, inicioJornadaMin, 0, 0);

    let restante = total;
    let dias = 1;

    const almInicio = grupo === "1" ? 12 : 13;
    const almFin = grupo === "1" ? 13 : 14;

    while (restante > 0) {
        const diaSemana = ahora.getDay();

        if (diaSemana === 0 || (diaSemana === 6 && trabajaSabado === "no")) {
            ahora.setDate(ahora.getDate() + 1);
            ahora.setHours(inicioJornadaHora, inicioJornadaMin, 0, 0);
            dias++;
            continue;
        }

        let actual = ahora.getHours() + (ahora.getMinutes() / 60);
        let finJornada = finJornadaHora + (finJornadaMin / 60);

        if (actual >= almInicio && actual < almFin) {
            ahora.setHours(almFin, 0, 0, 0);
            continue;
        }

        if (actual >= finJornada) {
            ahora.setDate(ahora.getDate() + 1);
            ahora.setHours(inicioJornadaHora, inicioJornadaMin, 0, 0);
            dias++;
            continue;
        }

        let tramo = actual < almInicio
            ? Math.min(finJornada, almInicio) - actual
            : finJornada - actual;

        if (restante <= tramo) {
            ahora = new Date(ahora.getTime() + restante * 3600000);
            restante = 0;
        } else {
            ahora = new Date(ahora.getTime() + tramo * 3600000);
            restante -= tramo;
        }
    }

    const horaFormateada = formatearHoraAMPM(ahora);

    const fechaFinInput = document.getElementById("fechaFin");
    const fechaFinVisual = document.getElementById("fechaFinVisual");

    const fechaFinISO = ahora.toISOString().split("T")[0];

    if (fechaFinInput) {
        fechaFinInput.value = fechaFinISO;
    }

    if (fechaFinVisual) {
        const dia = String(ahora.getDate()).padStart(2, "0");
        const mes = String(ahora.getMonth() + 1).padStart(2, "0");
        const anio = ahora.getFullYear();

        fechaFinVisual.value = `${dia}/${mes}/${anio}`;
    }

    salidaEl.textContent =
        `${Math.floor(total)}h ${Math.round((total % 1) * 60)}m → ${horaFormateada}`;

    diasEl.value = dias;
}

/* =========================
   VALIDAR SOLO NÚMEROS
========================= */
function permitirSoloNumeros(id) {
    const input = document.getElementById(id);

    if (!input) return;

    input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "");
    });

    input.addEventListener("paste", (e) => {
        e.preventDefault();

        const texto = (e.clipboardData || window.clipboardData).getData("text");
        input.value = texto.replace(/\D/g, "");
    });
}

/* =========================
   SITUACIÓN / EXTRA
========================= */
function abrirModalSituacion() {
    const modal = document.getElementById("modalSituacion");

    if (!modal) {
        console.error("No existe el modal con id modalSituacion");
        return;
    }

    modal.classList.add("active");
}

function cerrarModalSituacion() {
    const modal = document.getElementById("modalSituacion");

    if (!modal) return;

    modal.classList.remove("active");
}

function guardarSituacion() {
    const horas = parseInt(document.getElementById("modalSituacionHoras")?.value) || 0;
    const minutos = parseInt(document.getElementById("modalSituacionMinutos")?.value) || 0;
    const descripcion = document.getElementById("modalSituacionDescripcion")?.value.trim() || "";

    if (horas === 0 && minutos === 0) {
        alert("Debes ingresar un tiempo extra.");
        return;
    }

    if (descripcion === "") {
        alert("Debes ingresar el motivo o descripción.");
        return;
    }

    document.getElementById("situacionHoras").value = horas;
    document.getElementById("situacionMinutos").value = minutos;
    document.getElementById("situacionDescripcion").value = descripcion;

    cerrarModalSituacion();
    calcular();
}

/* =========================
   FALLO MÁQUINA
========================= */
function mostrarSelectorMaquinaFallo() {
    const fallo = document.getElementById("falloMaquina")?.value;
    const maquina = document.getElementById("maquinaFallo");

    if (!maquina) return;

    if (fallo === "si") {
        maquina.style.display = "block";
    } else {
        maquina.style.display = "none";
        maquina.value = "";
    }
}

/* =========================
   GUARDAR / ACTUALIZAR
========================= */
async function guardarDatos() {
    const pedidoBase = document.getElementById("pedido").value.trim();
    const ot = document.getElementById("ot")?.value.trim() || "";
    const pedido = ot ? `${pedidoBase}-${ot}` : pedidoBase;

    const codigo = document.getElementById("Codigo").value.trim();
    const producto = document.getElementById("Producto").value.trim();
    const cantidad = parseInt(document.getElementById("cantidadProductos").value) || 0;
    const fecha = document.getElementById("fecha").value;
    const fecha_fin = document.getElementById("fechaFin").value;
    const trabaja_sabado = document.getElementById("trabajaSabado").value;

    const situacion_horas = parseInt(document.getElementById("situacionHoras")?.value) || 0;
    const situacion_minutos = parseInt(document.getElementById("situacionMinutos")?.value) || 0;
    const situacion_descripcion = document.getElementById("situacionDescripcion")?.value.trim() || "";
    const tiempo_muerto = (situacion_horas * 60) + situacion_minutos;

    const fallo_maquina = document.getElementById("falloMaquina")?.value || "no";
    const maquina_fallo = document.getElementById("maquinaFallo")?.value || "";

    const dias = parseInt(document.getElementById("dias").value) || 0;
    const grupo = document.getElementById("grupo").value;
    const almuerzo = "no";
    const salida = document.getElementById("salida").textContent;

    const user = JSON.parse(localStorage.getItem("user"));

    if (!pedido || !codigo || !producto || cantidad <= 0) {
        alert("Completa los datos obligatorios");
        return;
    }

    if (!fecha) {
        alert("Debes ingresar la Fecha Inicio");
        return;
    }

    if (!salida || salida === "--") {
        alert("Primero debes calcular el tiempo de producción");
        return;
    }

    if (dias <= 0) {
        alert("Debe existir al menos 1 día de producción");
        return;
    }

    if (fallo_maquina === "si" && maquina_fallo === "") {
        alert("Debes seleccionar la máquina con fallo");
        return;
    }

    const filasValidacion = document.querySelectorAll("#tablaMaquinas tbody tr");

    let algunaActiva = false;
    let totalHoras = 0;

    filasValidacion.forEach(f => {
        const uso = f.querySelector(".uso").value;
        const horas = parseInt(f.querySelector(".horas").value) || 0;
        const minutos = parseInt(f.querySelector(".minutos").value) || 0;

        if (uso === "si") {
            algunaActiva = true;
            totalHoras += horas + (minutos / 60);
        }
    });

    if (!algunaActiva) {
        alert("Debes seleccionar al menos una máquina en 'Sí'");
        cambiarTabMonitoreo("maquinas");
        return;
    }

    if (totalHoras < 1) {
        alert("Debes ingresar al menos 1 hora total de trabajo");
        cambiarTabMonitoreo("maquinas");
        return;
    }

    const maquinas = [];

    filasValidacion.forEach(f => {
        maquinas.push({
            zona: f.getAttribute("data-zona"),
            maquina: f.getAttribute("data-maquina"),
            uso: f.querySelector(".uso").value,
            horas: parseInt(f.querySelector(".horas").value) || 0,
            minutos: parseInt(f.querySelector(".minutos").value) || 0
        });
    });

    const editandoId = localStorage.getItem("editandoId");

    const url = editandoId
        ? "php/actualizar_produccion.php"
        : "php/guardar_produccion.php";

    const body = {
        numero_pedido: pedido,
        codigo,
        producto,
        cantidad,
        fecha,
        fecha_fin,
        tiempo_muerto,
        situacion_horas,
        situacion_minutos,
        situacion_descripcion,
        fallo_maquina,
        maquina_fallo,
        dias,
        grupo,
        almuerzo,
        trabaja_sabado,
        salida,
        usuario_id: user?.id || null,
        maquinas
    };

    if (editandoId) body.id = editandoId;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success) {
            localStorage.removeItem("editandoId");
            alert("Guardado correctamente");

            limpiarFormulario();

            if (typeof renderProductos === "function") {
                renderProductos();
            }

            if (typeof cargarDashboard === "function") {
                cargarDashboard();
            }

        } else {
            alert(data.message);
        }

    } catch (e) {
        console.error(e);
        alert("Error servidor");
    }
}

/* =========================
   LIMPIAR
========================= */
function limpiarFormulario() {
    document.getElementById("pedido").value = "";

    const otInput = document.getElementById("ot");
    if (otInput) otInput.value = "";

    document.getElementById("Codigo").value = "";
    document.getElementById("Producto").value = "";
    document.getElementById("cantidadProductos").value = 1;
    document.getElementById("fecha").value = "";

    document.getElementById("dias").value = "";
    document.getElementById("fechaFin").value = "";

    const fechaFinVisual = document.getElementById("fechaFinVisual");
    if (fechaFinVisual) fechaFinVisual.value = "";

    document.getElementById("salida").textContent = "--";
    document.getElementById("grupo").value = "1";
    document.getElementById("trabajaSabado").value = "no";

    const situacionHoras = document.getElementById("situacionHoras");
    const situacionMinutos = document.getElementById("situacionMinutos");
    const situacionDescripcion = document.getElementById("situacionDescripcion");

    if (situacionHoras) situacionHoras.value = "0";
    if (situacionMinutos) situacionMinutos.value = "0";
    if (situacionDescripcion) situacionDescripcion.value = "";

    const modalHoras = document.getElementById("modalSituacionHoras");
    const modalMinutos = document.getElementById("modalSituacionMinutos");
    const modalDescripcion = document.getElementById("modalSituacionDescripcion");

    if (modalHoras) modalHoras.value = "0";
    if (modalMinutos) modalMinutos.value = "0";
    if (modalDescripcion) modalDescripcion.value = "";

    cerrarModalSituacion();

    const falloMaquina = document.getElementById("falloMaquina");
    const maquinaFallo = document.getElementById("maquinaFallo");

    if (falloMaquina) falloMaquina.value = "no";

    if (maquinaFallo) {
        maquinaFallo.value = "";
        maquinaFallo.style.display = "none";
    }

    document.querySelectorAll("#tablaMaquinas tbody tr").forEach(f => {
        const uso = f.querySelector(".uso");
        const horas = f.querySelector(".horas");
        const minutos = f.querySelector(".minutos");

        if (uso) uso.value = "no";
        if (horas) horas.value = 0;
        if (minutos) minutos.value = 0;

        actualizarColorFila(f);
    });

    document.getElementById("buscarMaquina") && (document.getElementById("buscarMaquina").value = "");
    document.getElementById("filtroUsoMaquinas") && (document.getElementById("filtroUsoMaquinas").value = "todas");

    filtroZonaActual = "todas";

    document.querySelectorAll(".zona-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.zona === "todas");
    });

    aplicarFiltrosMaquinas();
    calcular();
    cambiarTabMonitoreo("info");
}

/* =========================
   EVENTOS
========================= */
document.addEventListener("click", e => {
    if (!e.target.classList.contains("zona-btn")) return;

    document.querySelectorAll(".zona-btn").forEach(btn => btn.classList.remove("active"));

    e.target.classList.add("active");
    filtroZonaActual = e.target.dataset.zona;

    aplicarFiltrosMaquinas();
});

document.addEventListener("change", e => {
    const target = e.target;

    if (
        target.classList.contains("uso") ||
        target.classList.contains("horas") ||
        target.classList.contains("minutos") ||
        ["grupo", "trabajaSabado", "cantidadProductos", "fecha", "filtroUsoMaquinas"].includes(target.id)
    ) {
        const fila = target.closest("tr");

        if (fila) {
            actualizarColorFila(fila);
        }

        calcular();
        aplicarFiltrosMaquinas();

        if (typeof cargarEstadoMaquinasDashboard === "function") {
            cargarEstadoMaquinasDashboard();
        }
    }
});

document.addEventListener("input", e => {
    if (e.target.id === "cantidadProductos") {
        calcular();
    }

    if (e.target.id === "buscarMaquina") {
        aplicarFiltrosMaquinas();
    }
});

/* =========================
   TABS MONITOREO
========================= */
function cambiarTabMonitoreo(tab) {
    const tabInfo = document.getElementById("tabInfoMonitoreo");
    const tabMaquinas = document.getElementById("tabMaquinasMonitoreo");
    const botones = document.querySelectorAll(".monitor-tab");

    if (!tabInfo || !tabMaquinas) return;

    tabInfo.classList.remove("active");
    tabMaquinas.classList.remove("active");

    botones.forEach(btn => btn.classList.remove("active"));

    if (tab === "info") {
        tabInfo.classList.add("active");
        botones[0]?.classList.add("active");
    }

    if (tab === "maquinas") {
        tabMaquinas.classList.add("active");
        botones[1]?.classList.add("active");
    }
}

/* =========================
   INICIO
========================= */
window.addEventListener("DOMContentLoaded", () => {
    permitirSoloNumeros("pedido");
    permitirSoloNumeros("ot");
    permitirSoloNumeros("Codigo");

    cargarMaquinasDesdeBD();
    cambiarTabMonitoreo("info");
});

/* =========================
   FUNCIONES GLOBALES
========================= */
window.abrirModalSituacion = abrirModalSituacion;
window.cerrarModalSituacion = cerrarModalSituacion;
window.guardarSituacion = guardarSituacion;
window.mostrarSelectorMaquinaFallo = mostrarSelectorMaquinaFallo;
window.guardarDatos = guardarDatos;
window.limpiarFormulario = limpiarFormulario;
window.cambiarTabMonitoreo = cambiarTabMonitoreo;