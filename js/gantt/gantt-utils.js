console.log("Gantt existe:", typeof window.Gantt);

/* =========================
   ESPERAR LIBRERÍA GANTT
========================= */
function esperarGantt(callback){
    if (window.Gantt) callback();
    else setTimeout(() => esperarGantt(callback), 200);
}

/* =========================
   NORMALIZAR FECHA YYYY-MM-DD
========================= */
function fechaParaGantt(fecha) {
    if (!fecha) return null;

    if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return fecha;
    }

    if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
        return fecha.substring(0, 10);
    }

    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
        const y = fecha.getFullYear();
        const m = String(fecha.getMonth() + 1).padStart(2, "0");
        const d = String(fecha.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    if (typeof fecha === "string") {
        const meses = {
            enero: "01",
            febrero: "02",
            marzo: "03",
            abril: "04",
            mayo: "05",
            junio: "06",
            julio: "07",
            agosto: "08",
            septiembre: "09",
            octubre: "10",
            noviembre: "11",
            diciembre: "12"
        };

        const partes = fecha.toLowerCase().trim().split(" ");

        if (partes.length === 5) {
            const dia = partes[0].padStart(2, "0");
            const mes = meses[partes[2]];
            const anio = partes[4];

            if (dia && mes && anio) return `${anio}-${mes}-${dia}`;
        }
    }

    console.warn("⚠️ No se pudo convertir esta fecha:", fecha);
    return null;
}

/* =========================
   FECHA LOCAL SIN DESFASE UTC
========================= */
function fechaLocal(fechaTexto) {
    const limpia = fechaParaGantt(fechaTexto);
    if (!limpia) return null;

    const [anio, mes, dia] = limpia.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
}

/* =========================
   SUMAR DÍAS
========================= */
function sumarDias(fechaBase, dias) {
    const fecha = fechaLocal(fechaBase);
    if (!fecha) return null;

    fecha.setDate(fecha.getDate() + dias);
    return fechaParaGantt(fecha);
}

/* =========================
   CALCULAR PROGRESO
========================= */
function calcularProgreso(inicio, fin){
    const hoy = new Date();
    const fechaInicio = fechaLocal(inicio);
    const fechaFin = fechaLocal(fin);

    if (!fechaInicio || !fechaFin) return 0;

    fechaFin.setHours(23, 59, 59);

    if (hoy <= fechaInicio) return 0;
    if (hoy >= fechaFin) return 100;

    const total = fechaFin - fechaInicio;
    const transcurrido = hoy - fechaInicio;

    return Math.round((transcurrido / total) * 100);
}

/* =========================
   CLASE POR ESTADO REAL
========================= */
function obtenerClaseEstado(progress, item, fin){

    const tiempoMuerto = parseFloat(item.tiempo_muerto || 0);

    const estado = String(
        item.estado_real ||
        item.estado_actual ||
        item.estado_bd ||
        "pendiente"
    )
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");

    /*
        COLOR PRINCIPAL = ESTADO REAL
        El atraso se manejará después como alerta visual aparte.
    */

    if (
        estado === "atrasado" ||
        estado === "retraso" ||
        estado === "con_retraso"
    ) {
        return "gantt-atrasado";
    }

    if (
        estado === "terminado" ||
        estado === "entregado"
    ) {
        return "gantt-terminado";
    }

    if (
        tiempoMuerto > 0 ||
        estado === "pausado" ||
        estado === "tiempo_muerto"
    ) {
        return "gantt-tiempo-muerto";
    }

    if (
        estado === "en_proceso" ||
        estado === "proceso"
    ) {
        return "gantt-proceso";
    }

    if (
        estado === "pendiente" ||
        estado === "" ||
        estado === "null"
    ) {
        return "gantt-pendiente";
    }

    console.warn("Estado Gantt no reconocido:", estado, item);

    return "gantt-pendiente";
}
/* =========================
   COLOR
========================= */
function colorEstado(clase) {
    if (clase === "gantt-proceso") return "#28a745";
    if (clase === "gantt-pendiente") return "#5dade2";
    if (clase === "gantt-atrasado") return "#e74c3c";
    if (clase === "gantt-tiempo-muerto") return "#f39c12";
    if (clase === "gantt-terminado") return "#9aa0a6";
    return "#5dade2";
}

function hayChoqueFechas(inicioA, finA, inicioB, finB) {
    const aInicio = new Date(inicioA + "T00:00:00");
    const aFin = new Date(finA + "T00:00:00");
    const bInicio = new Date(inicioB + "T00:00:00");
    const bFin = new Date(finB + "T00:00:00");

    if (isNaN(aInicio) || isNaN(aFin) || isNaN(bInicio) || isNaN(bFin)) {
        return false;
    }

    return aInicio <= bFin && bInicio <= aFin;
}