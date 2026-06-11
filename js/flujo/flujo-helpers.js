/* =========================
   HELPERS
========================= */
function formatearDuracion(horas, minutos) {
    const h = parseInt(horas) || 0;
    const m = parseInt(minutos) || 0;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function convertirMinutosAHHMM(totalMinutos) {
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function escaparHTML(texto) {
    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
