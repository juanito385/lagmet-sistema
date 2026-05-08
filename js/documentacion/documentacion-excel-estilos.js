/* =========================
   HELPERS VISUALES EXCEL PRO
========================= */
function borderExcelSuave() {
    return {
        top: { style: "thin", color: { argb: "FFD9D9D9" } },
        left: { style: "thin", color: { argb: "FFD9D9D9" } },
        bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
        right: { style: "thin", color: { argb: "FFD9D9D9" } }
    };
}

function fondoFilaExcel() {
    return {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" }
    };
}

function colorExcelEstadoSuave(estado) {
    if (estado === "proceso") return "FF92D050";
    if (estado === "pendiente") return "FF5B9BD5";
    if (estado === "atrasado") return "FFFF4D4D";
    if (estado === "tiempo-muerto") return "FFFFC000";
    if (estado === "terminado") return "FFA6A6A6";
    return "FFFFFFFF";
}

function borderBarraExcel(estado) {
    let color = "FF666666";

    if (estado === "proceso") color = "FF2E7D32";
    if (estado === "pendiente") color = "FF1565C0";
    if (estado === "atrasado") color = "FFB71C1C";
    if (estado === "tiempo-muerto") color = "FFB26A00";
    if (estado === "terminado") color = "FF6B7280";

    return {
        top: { style: "medium", color: { argb: color } },
        left: { style: "medium", color: { argb: color } },
        bottom: { style: "medium", color: { argb: color } },
        right: { style: "medium", color: { argb: color } }
    };
}

/* =========================
   ESTILOS EXCEL ANTIGUOS / RESPALDO
========================= */
function borderExcel() {
    return {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } }
    };
}

function colorExcelEstado(estado) {
    if (estado === "proceso") return "FF92D050";
    if (estado === "pendiente") return "FF5B9BD5";
    if (estado === "atrasado") return "FFFF0000";
    if (estado === "tiempo-muerto") return "FFFFC000";
    if (estado === "terminado") return "FFA6A6A6";
    return "FFFFFFFF";
}