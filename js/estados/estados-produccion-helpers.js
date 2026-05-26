function obtenerFechaISOEstado(fecha) {
    if (!fecha) return "";

    return fecha.split(" ")[0];
}

/* =========================
   HELPERS ESTADOS
========================= */
function obtenerClaseBadgeEstado(estado) {
    const clases = {
        pendiente: "badge-pendiente",
        en_proceso: "badge-proceso",
        pausado: "badge-pausado",
        terminado: "badge-terminado",
        entregado: "badge-entregado",
        atrasado: "badge-atrasado"
    };

    return clases[estado] || "badge-pendiente";
}

function obtenerClaseBarraEstado(estado) {
    const clases = {
        en_proceso: "yellow",
        pausado: "orange",
        atrasado: "red",
        pendiente: "empty"
    };

    return clases[estado] || "";
}

function formatearTextoEstado(estado) {
    const textos = {
        pendiente: "Pendiente",
        en_proceso: "En proceso",
        pausado: "Pausado",
        terminado: "Terminado",
        entregado: "Entregado",
        atrasado: "Atrasado"
    };

    return textos[estado] || "Pendiente";
}

function calcularProgresoEstado(estado, fechaInicio, fechaFin) {
    if (estado === "terminado" || estado === "entregado") return 100;
    if (estado === "pendiente") return 0;

    if (!fechaInicio || !fechaFin) {
        if (estado === "pausado") return 40;
        if (estado === "atrasado") return 75;
        return 50;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const hoy = new Date();

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        return 50;
    }

    const total = fin - inicio;
    const avance = hoy - inicio;

    if (total <= 0) return 100;

    let porcentaje = Math.round((avance / total) * 100);

    if (porcentaje < 0) porcentaje = 0;
    if (porcentaje > 100) porcentaje = 100;

    return porcentaje;
}

function formatearFechaEstado(fecha) {
    if (!fecha) return "Sin fecha";

    const fechaLimpia = fecha.split(" ")[0];
    const partes = fechaLimpia.split("-");

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* =========================
   ALERTA DE ATRASO

/* =========================
   HELPERS DETALLE / HISTORIAL
========================= */
function actualizarTextoEstado(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor || "—";
    }
}

function formatearFechaHoraEstado(fecha) {
    if (!fecha) return "Sin fecha";

    const partes = fecha.split(" ");
    const fechaBase = partes[0] || "";
    const horaBase = partes[1] || "";

    const fechaFormateada = formatearFechaEstado(fechaBase);

    if (!horaBase) return fechaFormateada;

    const horaCorta = horaBase.substring(0, 5);

    return `${fechaFormateada} ${horaCorta}`;
}

function obtenerIconoEstado(estado) {
    const iconos = {
        pendiente: "schedule",
        en_proceso: "play_circle",
        pausado: "pause_circle",
        terminado: "check_circle",
        entregado: "local_shipping",
        atrasado: "warning"
    };

    return iconos[estado] || "info";
}

function obtenerClaseIconoEstado(estado) {
    const clases = {
        pendiente: "icono-pendiente",
        en_proceso: "icono-proceso",
        pausado: "icono-pausado",
        terminado: "icono-terminado",
        entregado: "icono-entregado",
        atrasado: "icono-atrasado"
    };

    return clases[estado] || "icono-pendiente";
}

function obtenerClaseTimelineEstado(estado) {
    const clases = {
        pendiente: "blue",
        en_proceso: "yellow",
        pausado: "orange",
        terminado: "green",
        entregado: "purple",
        atrasado: "red"
    };

    return clases[estado] || "blue";
}
