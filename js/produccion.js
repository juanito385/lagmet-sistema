/* =========================
   JORNADA
========================= */
const inicioJornadaHora = 7;
const inicioJornadaMin = 30;
const finJornadaHora = 16;
const finJornadaMin = 45;

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
   MAQUINAS
========================= */
const oriente = [
    "Torno Vertical CNC","Mandrinadora","Torno Vertical",
    "Mandrinadora","Torno 1000","Torno 800",
    "Torno Bulgaro","Torno Varileta","Cepillo",
    "Escoplo","Taladro Radial"
];

const poniente = [
    "Torno CNC 2","Torno CNC 3","Torno CNC 1",
    "Centro Mecanizado 1","Centro Mecanizado 2",
    "Router","Mecánica Banco","Balanceadora"
];

/* =========================
   CREAR TABLAS
========================= */
function crear(lista, id, zona) {
    const tbody = document.querySelector(`#${id} tbody`);
    if (!tbody) return;

    tbody.innerHTML = "";

    lista.forEach(maquina => {
        const fila = document.createElement("tr");

        fila.setAttribute("data-zona", zona);
        fila.setAttribute("data-maquina", maquina);

        fila.innerHTML = `
            <td>${maquina}</td>
            <td>
                <select class="uso">
                    <option value="no">No</option>
                    <option value="si">Sí</option>
                </select>
            </td>
            <td>
                <select class="horas">${horas()}</select>
                <select class="minutos">${minutos()}</select>
            </td>
        `;

        fila.classList.add("maquina-inactiva");
        tbody.appendChild(fila);
    });
}

/* =========================
   COLOR FILAS MAQUINAS
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
        .querySelectorAll("#tablaOriente tbody tr, #tablaPoniente tbody tr")
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
   CALCULO
========================= */
function calcular() {
    let total = 0;

    const filas = document.querySelectorAll("#tablaOriente tbody tr, #tablaPoniente tbody tr");

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

    if (document.getElementById("almuerzo")?.value === "si") {
        total += 0.75;
    }

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
        const diaSemana = ahora.getDay(); // 0 domingo, 6 sábado

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

    const horaFormateada = ahora.toLocaleTimeString("es-CL", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).toUpperCase();

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
   GUARDAR / ACTUALIZAR
========================= */
async function guardarDatos() {

    const pedido = document.getElementById("pedido").value.trim();
    const codigo = document.getElementById("Codigo").value.trim();
    const producto = document.getElementById("Producto").value.trim();
    const cantidad = parseInt(document.getElementById("cantidadProductos").value) || 0;
    const fecha = document.getElementById("fecha").value;
    const fecha_fin = document.getElementById("fechaFin").value;
    const trabaja_sabado = document.getElementById("trabajaSabado").value;
    const tiempo_muerto = parseInt(document.getElementById("tiempoMuerto").value) || 0;
    const dias = parseInt(document.getElementById("dias").value) || 0;
    const grupo = document.getElementById("grupo").value;
    const almuerzo = document.getElementById("almuerzo").value;
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

        /* =========================
        VALIDACIÓN MAQUINAS
        ========================= */

        const filasValidacion = document.querySelectorAll("#tablaOriente tbody tr, #tablaPoniente tbody tr");

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

    /* ❌ Ninguna máquina seleccionada */
    if (!algunaActiva) {
        alert("Debes seleccionar al menos una máquina en 'Sí'");
        return;
    }

    /* ❌ Menos de 1 hora total */
    if (totalHoras < 1) {
        alert("Debes ingresar al menos 1 hora total de trabajo");
        return;
    }

    const filas = document.querySelectorAll("#tablaOriente tbody tr, #tablaPoniente tbody tr");

    const maquinas = [];

    filas.forEach(f => {
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
    document.getElementById("Codigo").value = "";
    document.getElementById("Producto").value = "";
    document.getElementById("cantidadProductos").value = 1;
    document.getElementById("fecha").value = "";
    document.getElementById("tiempoMuerto").value = "";
    document.getElementById("dias").value = "";
    document.getElementById("fechaFin").value = "";
    document.getElementById("salida").textContent = "--";
    document.getElementById("grupo").value = "1";
    document.getElementById("almuerzo").value = "no";
    document.getElementById("trabajaSabado").value = "no";

    document.querySelectorAll("#tablaOriente tbody tr, #tablaPoniente tbody tr").forEach(f => {
        if (f.querySelector(".uso")) {
            f.querySelector(".uso").value = "no";
            f.querySelector(".horas").value = 0;
            f.querySelector(".minutos").value = 0;
            actualizarColorFila(f);
        }
    });

    calcular();
}

/* =========================
   EVENTOS
========================= */
document.addEventListener("change", e => {
    const target = e.target;

    if (
    target.classList.contains("uso") ||
    target.classList.contains("horas") ||
    target.classList.contains("minutos") ||
    ["almuerzo", "grupo", "trabajaSabado", "cantidadProductos", "fecha"].includes(target.id)
    ) {
        const fila = target.closest("tr");

        if (fila) {
            actualizarColorFila(fila);
        }

        calcular();

        if (typeof cargarEstadoMaquinasDashboard === "function") {
            cargarEstadoMaquinasDashboard();
        }
    }
});

document.addEventListener("input", e => {
    if (e.target.id === "cantidadProductos") calcular();
});

/* =========================
   INICIO
========================= */
window.addEventListener("DOMContentLoaded", () => {
    crear(oriente,"tablaOriente","oriente");
    crear(poniente,"tablaPoniente","poniente");
    actualizarColorTodasLasFilas();
    calcular();
});