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
   NORMALIZAR FECHA PARA GANTT
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

            if (dia && mes && anio) {
                return `${anio}-${mes}-${dia}`;
            }
        }
    }

    console.warn("⚠️ No se pudo convertir esta fecha:", fecha);
    return null;
}

/* =========================
   SUMAR DÍAS
========================= */
function sumarDias(fechaBase, dias) {
    const fechaLimpia = fechaParaGantt(fechaBase);

    if (!fechaLimpia) return null;

    const partes = fechaLimpia.split("-");
    const fecha = new Date(
        parseInt(partes[0]),
        parseInt(partes[1]) - 1,
        parseInt(partes[2])
    );

    fecha.setDate(fecha.getDate() + dias);

    return fechaParaGantt(fecha);
}

/* =========================
   CALCULAR PROGRESO
========================= */
function calcularProgreso(inicio, fin){
    const hoy = new Date();
    const fechaInicio = new Date(inicio + "T00:00:00");
    const fechaFin = new Date(fin + "T23:59:59");

    if (hoy <= fechaInicio) return 0;
    if (hoy >= fechaFin) return 100;

    const total = fechaFin - fechaInicio;
    const transcurrido = hoy - fechaInicio;

    return Math.round((transcurrido / total) * 100);
}

/* =========================
   CLASE POR ESTADO
========================= */
function obtenerClaseEstado(progress, item, fin){
    const tiempoMuerto = parseFloat(item.tiempo_muerto || 0);
    const hoy = new Date();
    const fechaFin = new Date(fin + "T23:59:59");

    if (progress < 100 && hoy > fechaFin) {
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
   COLOR PARA SIDEBAR
========================= */
function colorEstado(clase) {
    if (clase === "gantt-proceso") return "#28a745";
    if (clase === "gantt-pendiente") return "#5dade2";
    if (clase === "gantt-atrasado") return "#e74c3c";
    if (clase === "gantt-tiempo-muerto") return "#f39c12";
    if (clase === "gantt-terminado") return "#9aa0a6";
    return "#5dade2";
}

/* =========================
   RENDER SIDEBAR GANTT
========================= */
function renderGanttSidebar(tareasSidebar) {
    const sidebar = document.getElementById("gantt-sidebar");

    if (!sidebar) {
        console.warn("⚠️ No existe #gantt-sidebar");
        return;
    }

    sidebar.innerHTML = `
        <div class="gantt-side-head">
            <strong>Producto</strong>
            <strong>Máquina</strong>
            <strong>Operador</strong>
        </div>
    `;

    tareasSidebar.forEach(item => {
        const fila = document.createElement("div");
        fila.className = "gantt-side-row";

        fila.innerHTML = `
            <div class="gantt-side-producto">
                <span class="gantt-color-dot" style="background:${colorEstado(item.claseEstado)}"></span>
                <strong>${item.producto}</strong>
                <small>(${item.pedido})</small>
            </div>

            <div>${item.maquina}</div>
            <div>${item.operador}</div>
        `;

        sidebar.appendChild(fila);
    });
}

/* =========================
   IR A HOY
========================= */
window.irHoy = function(){
    const botonToday = document.querySelector("#gantt .today-button");

    if (botonToday) {
        botonToday.click();
    } else {
        mostrarGantt();
    }
};

/* =========================
   MOSTRAR GANTT
========================= */
window.mostrarGantt = async function(){

    console.log("🔥 MOSTRANDO GANTT NUEVO");

    esperarGantt(async () => {

        const cont = document.getElementById("gantt");
        const sidebar = document.getElementById("gantt-sidebar");

        if (!cont) {
            console.error("❌ No existe el div #gantt");
            return;
        }

        cont.innerHTML = "Cargando Gantt...";

        if (sidebar) {
            sidebar.innerHTML = "";
        }

        try {
            const response = await fetch("php/obtener_produccion.php");
            const data = await response.json();

            console.log("📦 Datos recibidos:", data);

            if (!data.success || !data.data || !data.data.length) {
                cont.innerHTML = "No hay datos para generar la carta Gantt";
                return;
            }

            data.data.sort((a, b) => {
                const fechaA = fechaParaGantt(a.fecha) || "9999-12-31";
                const fechaB = fechaParaGantt(b.fecha) || "9999-12-31";

                return new Date(fechaA) - new Date(fechaB);
            });

            const tareasSidebar = [];

            const tareas = data.data.map((item, index) => {

                let inicio = fechaParaGantt(item.fecha);

                if (!inicio) {
                    console.warn("⚠️ Producto sin fecha válida:", item);
                    inicio = fechaParaGantt(new Date());
                }

                let fin = fechaParaGantt(item.fecha_fin);

                if (!fin) {
                    let dias = parseInt(item.dias);

                    if (isNaN(dias) || dias <= 0) {
                        dias = 1;
                    }

                    fin = sumarDias(inicio, dias);
                }

                if (!fin) {
                    fin = sumarDias(inicio, 1);
                }

                if (new Date(inicio) > new Date(fin)) {
                    console.warn("⚠️ Fecha inicio mayor que fin, corrigiendo:", item);
                    fin = sumarDias(inicio, 1);
                }

                const progress = calcularProgreso(inicio, fin);
                const claseEstado = obtenerClaseEstado(progress, item, fin);

                const producto = item.producto || "Sin nombre";
                const pedido = item.numero_pedido || "-";

                const maquina =
                    item.maquina ||
                    item.maquinas ||
                    item.nombre_maquina ||
                    "Sin máquina";

                const operador =
                    item.operador ||
                    item.usuario ||
                    item.usuario_nombre ||
                    "Admin";

                tareasSidebar.push({
                    producto,
                    pedido,
                    maquina,
                    operador,
                    claseEstado
                });

                return {
                    id: String(item.id || index + 1),
                    name: `${producto} (${pedido})`,
                    start: inicio,
                    end: fin,
                    progress: progress,
                    dependencies: "",
                    custom_class: claseEstado
                };
            });

            const tareasValidas = tareas.filter(tarea => {
                return tarea.start &&
                       tarea.end &&
                       !isNaN(new Date(tarea.start).getTime()) &&
                       !isNaN(new Date(tarea.end).getTime());
            });

            const sidebarValidas = tareasSidebar.filter((_, index) => tareasValidas[index]);

            console.log("📊 Tareas Gantt:", tareas);
            console.log("✅ Tareas válidas:", tareasValidas);

            if (!tareasValidas.length) {
                cont.innerHTML = "No hay tareas válidas para mostrar en la Carta Gantt";
                return;
            }

            cont.innerHTML = "";

            renderGanttSidebar(sidebarValidas);

            new window.Gantt("#gantt", tareasValidas, {
                header_height: 74,
                column_width: 38,
                step: 24,
                view_mode: "Day",
                language: "es",
                bar_height: 30,
                padding: 22
            });

            setTimeout(() => {
                const ganttContainer = document.querySelector("#gantt .gantt-container");
                const svg = document.querySelector("#gantt svg");

                if (ganttContainer) {
                    ganttContainer.style.height = "560px";
                    ganttContainer.style.minHeight = "560px";
                    ganttContainer.style.overflow = "auto";
                }

                if (svg) {
                    svg.setAttribute("height", "560");
                    svg.style.height = "560px";
                    svg.style.minHeight = "560px";
                }
            }, 150);

        } catch (error) {
            console.error("❌ Error al generar la Carta Gantt:", error);
            cont.innerHTML = "Error al generar la carta Gantt";
        }

    });
};