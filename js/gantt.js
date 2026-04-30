console.log("🔥 GANTT.JS CARGADO");
console.log("Gantt existe:", typeof window.Gantt);

/* =========================
   ESPERAR LIBRERÍA GANTT
========================= */
function esperarGantt(callback){
    if (window.Gantt) {
        callback();
    } else {
        console.warn("⏳ Esperando carga de Frappe Gantt...");
        setTimeout(() => esperarGantt(callback), 200);
    }
}

/* =========================
   CALCULAR PROGRESO REAL
========================= */
function calcularProgreso(inicio, fin){
    const hoy = new Date();
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    if (hoy <= fechaInicio) return 0;
    if (hoy >= fechaFin) return 100;

    const total = fechaFin - fechaInicio;
    const transcurrido = hoy - fechaInicio;

    return Math.round((transcurrido / total) * 100);
}

/* =========================
   DEFINIR COLOR / ESTADO
========================= */
function obtenerClaseEstado(progress, item, fin){
    const tiempoMuerto = parseFloat(item.tiempo_muerto || 0);
    const hoy = new Date();

    if (progress < 100 && hoy > fin) {
        return "gantt-atrasado";
    }

    if (tiempoMuerto > 0) {
        return "gantt-tiempo-muerto";
    }

    if (progress === 0) {
        return "gantt-pendiente";
    }

    if (progress >= 100) {
        return "gantt-terminado";
    }

    return "gantt-proceso";
}

/* =========================
   FORMATEAR FECHA
========================= */
function formatearFecha(fecha){
    return fecha.toISOString().split("T")[0];
}

/* =========================
   GANTT DOCUMENTACION
========================= */
window.mostrarGantt = async function(){

    console.log("🔥 MOSTRANDO GANTT NUEVO");

    esperarGantt(async () => {

        const cont = document.getElementById("gantt");

        if (!cont) {
            console.error("❌ No existe el div #gantt");
            return;
        }

        cont.innerHTML = "Cargando Gantt...";

        try {
            const response = await fetch("php/obtener_produccion.php");
            const data = await response.json();

            console.log("📦 Datos recibidos:", data);

            if (!data.success || !data.data || !data.data.length) {
                cont.innerHTML = "No hay datos para generar la carta Gantt";
                return;
            }

            data.data.sort((a, b) => {
                const productoA = (a.producto || "").toLowerCase();
                const productoB = (b.producto || "").toLowerCase();

                if (productoA < productoB) return -1;
                if (productoA > productoB) return 1;

                return new Date(a.fecha) - new Date(b.fecha);
            });

            const tareas = data.data.map((item, index) => {

                let fechaInicio = item.fecha;

                if (!fechaInicio) {
                    console.warn("⚠️ Producto sin fecha:", item);
                    fechaInicio = "2026-04-01";
                }

                const partes = fechaInicio.split("-");

                let inicio = new Date(
                    parseInt(partes[0]),
                    parseInt(partes[1]) - 1,
                    parseInt(partes[2])
                );

                if (isNaN(inicio.getTime())) {
                    console.error("❌ Fecha inválida:", fechaInicio);
                    inicio = new Date();
                }

                let dias = parseInt(item.cantidad);

                if (isNaN(dias) || dias <= 0) {
                    dias = 1;
                }

                const fin = new Date(inicio);
                fin.setDate(inicio.getDate() + dias);

                const progress = calcularProgreso(inicio, fin);
                const claseEstado = obtenerClaseEstado(progress, item, fin);

                return {
                    id: String(item.id || index + 1),
                    name: `${item.producto || "Sin nombre"} (${item.numero_pedido || "-"})`,
                    start: formatearFecha(inicio),
                    end: formatearFecha(fin),
                    progress: progress,
                    custom_class: claseEstado
                };
            });

            console.log("📊 Tareas Gantt:", tareas);

            cont.innerHTML = "";

            new window.Gantt("#gantt", tareas);

            setTimeout(() => {
                const ganttContainer = document.querySelector("#gantt .gantt-container");
                const svg = document.querySelector("#gantt svg");

                if (ganttContainer) {
                    ganttContainer.style.height = "560px";
                    ganttContainer.style.minHeight = "560px";
                    ganttContainer.style.overflow = "auto";
                }

                if (svg) {
                    svg.setAttribute("height", "520");
                    svg.style.height = "520px";
                    svg.style.minHeight = "520px";
                }
            }, 150);

        } catch (error) {
            console.error("❌ Error al generar la Carta Gantt:", error);
            cont.innerHTML = "Error al generar la carta Gantt";
        }

    });
};