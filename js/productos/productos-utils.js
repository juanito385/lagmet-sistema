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