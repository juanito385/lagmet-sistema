/* =========================
   ESTADO PRODUCTO
========================= */
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

/* =========================
   ESTADO REAL PRODUCTO
========================= */
function obtenerEstadoRealProducto(estadoBD) {
    const estado = normalizarTexto(estadoBD || "pendiente");

    if (estado === "pendiente") {
        return {
            texto: "Pendiente",
            clase: "estado-pendiente"
        };
    }

    if (estado === "en_proceso" || estado === "en proceso") {
        return {
            texto: "En proceso",
            clase: "estado-proceso"
        };
    }

    if (estado === "pausado") {
        return {
            texto: "Pausado",
            clase: "estado-pausado"
        };
    }

    if (estado === "terminado") {
        return {
            texto: "Terminado",
            clase: "estado-terminado"
        };
    }

    if (estado === "entregado") {
        return {
            texto: "Entregado",
            clase: "estado-entregado"
        };
    }

    return {
        texto: "Pendiente",
        clase: "estado-pendiente"
    };
}

/* =========================
   ALERTA DE ATRASO PRODUCTO
========================= */
function productoTieneAlertaAtraso(item) {
    return item.esta_atrasado === true ||
           item.esta_atrasado === 1 ||
           item.esta_atrasado === "1" ||
           item.esta_atrasado === "true";
}

/* =========================
   FORMATEAR FECHA VISUAL
========================= */
function formatearFechaVisual(fechaStr) {
    if (!fechaStr || fechaStr === "-") return "-";

    const partes = fechaStr.split("-");
    if (partes.length !== 3) return fechaStr;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* =========================
   NORMALIZAR TEXTO
========================= */
function normalizarTexto(texto) {
    return String(texto || "")
        .trim()
        .toLowerCase()
        .replace(/\(\d+\)/g, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}