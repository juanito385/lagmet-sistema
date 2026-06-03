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

function borderExcelFuerte() {
    return {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } }
    };
}

function fondoFilaExcel() {
    return {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" }
    };
}

/* =========================
   COLORES OFICIALES GANTT EXCEL
   Deben coincidir con la lógica visual actual
========================= */
function colorExcelEstadoSuave(estado) {

    const estadoNormalizado = String(estado || "")
        .trim()
        .toLowerCase()
        .replace(/_/g, "-");

    /*
        Mapeo esperado:
        - En proceso    = Amarillo
        - Pendiente     = Azul
        - Atrasado      = Rojo
        - Tiempo muerto = Naranjo
        - Terminado     = Verde
    */

    if (estadoNormalizado === "proceso") return "FFFFD966";
    if (estadoNormalizado === "pendiente") return "FF5B9BD5";
    if (estadoNormalizado === "atrasado") return "FFFF4D4D";
    if (estadoNormalizado === "tiempo-muerto") return "FFF39C12";
    if (estadoNormalizado === "terminado") return "FF92D050";

    return "FFFFFFFF";
}

function borderBarraExcel(estado) {

    const estadoNormalizado = String(estado || "")
        .trim()
        .toLowerCase()
        .replace(/_/g, "-");

    let color = "FF666666";

    if (estadoNormalizado === "proceso") color = "FFB45309";
    if (estadoNormalizado === "pendiente") color = "FF1565C0";
    if (estadoNormalizado === "atrasado") color = "FFB71C1C";
    if (estadoNormalizado === "tiempo-muerto") color = "FFB26A00";
    if (estadoNormalizado === "terminado") color = "FF2E7D32";

    return {
        top: { style: "medium", color: { argb: color } },
        left: { style: "medium", color: { argb: color } },
        bottom: { style: "medium", color: { argb: color } },
        right: { style: "medium", color: { argb: color } }
    };
}

/* =========================
   ESTILOS EXCEL ANTIGUOS / RESPALDO
   Se mantienen por compatibilidad
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

    const estadoNormalizado = String(estado || "")
        .trim()
        .toLowerCase()
        .replace(/_/g, "-");

    if (estadoNormalizado === "proceso") return "FFFFD966";
    if (estadoNormalizado === "pendiente") return "FF5B9BD5";
    if (estadoNormalizado === "atrasado") return "FFFF0000";
    if (estadoNormalizado === "tiempo-muerto") return "FFF39C12";
    if (estadoNormalizado === "terminado") return "FF92D050";

    return "FFFFFFFF";
}