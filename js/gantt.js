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
    mostrarGanttPorMaquina();
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

window.mostrarGanttPorMaquina = async function(){

    console.log("🔥 GANTT POR MÁQUINA AVANZADO");

    const cont = document.getElementById("gantt");
    const sidebar = document.getElementById("gantt-sidebar");

    if (!cont) return;

    cont.innerHTML = "Cargando Gantt por máquina...";
    if (sidebar) sidebar.innerHTML = "";

    try {
        const response = await fetch("php/obtener_produccion.php");
        const data = await response.json();

        if (!data.success || !data.data || !data.data.length) {
            cont.innerHTML = "No hay datos";
            return;
        }

        const registros = data.data.map(item => {
            let inicio = fechaParaGantt(item.fecha);
            let fin = fechaParaGantt(item.fecha_fin);

            if (!inicio) inicio = fechaParaGantt(new Date());

            if (!fin) {
                let dias = parseInt(item.dias);
                if (isNaN(dias) || dias <= 0) dias = 1;
                fin = sumarDias(inicio, dias);
            }

            if (new Date(inicio) > new Date(fin)) {
                fin = sumarDias(inicio, 1);
            }

            const progress = calcularProgreso(inicio, fin);
            const claseEstado = obtenerClaseEstado(progress, item, fin);

            return {
                id: item.id,
                producto: item.producto || "Sin nombre",
                pedido: item.numero_pedido || "-",
                maquina: item.maquina || "Sin máquina",
                operador: item.usuario || "Admin",
                inicio,
                fin,
                claseEstado
            };
        });

        const fechas = registros.flatMap(r => [new Date(r.inicio), new Date(r.fin)]);
        const minFecha = new Date(Math.min(...fechas));
        const maxFecha = new Date(Math.max(...fechas));

        minFecha.setDate(minFecha.getDate() - 2);
        maxFecha.setDate(maxFecha.getDate() + 4);

        const MS_DIA = 1000 * 60 * 60 * 24;
        const totalDias = Math.ceil((maxFecha - minFecha) / MS_DIA);
        const anchoDia = 48;

        const agrupado = {};

        registros.forEach(item => {
            if (!agrupado[item.maquina]) {
                agrupado[item.maquina] = {
                    maquina: item.maquina,
                    operador: item.operador,
                    tareas: []
                };
            }

            agrupado[item.maquina].tareas.push(item);
        });

        Object.values(agrupado).forEach(grupo => {
            grupo.tareas.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
        });

        const maquinas = Object.values(agrupado);

        if (sidebar) {
            sidebar.innerHTML = `
                <div class="gantt-side-head machine-mode">
                    <strong>Máquina</strong>
                    <strong>Operador</strong>
                </div>
            `;

            maquinas.forEach(grupo => {
                const fila = document.createElement("div");
                fila.className = "gantt-side-row machine-mode";

                fila.innerHTML = `
                    <div class="gantt-side-producto">
                        <span class="gantt-color-dot" style="background:#28a745"></span>
                        <div>
                            <strong>${grupo.maquina}</strong>
                            <small>(${grupo.tareas.length} productos)</small>
                        </div>
                    </div>

                    <div>${grupo.operador}</div>
                `;

                sidebar.appendChild(fila);
            });
        }

        let diasHtml = "";
        let mesesHtml = "";
        let mesActual = "";

        for (let i = 0; i <= totalDias; i++) {
            const fecha = new Date(minFecha);
            fecha.setDate(minFecha.getDate() + i);

            const dia = String(fecha.getDate()).padStart(2, "0");
            const mes = fecha.toLocaleDateString("es-CL", { month: "long" });

            diasHtml += `<div class="gantt-day">${dia}</div>`;

            if (mes !== mesActual) {
                mesActual = mes;
                mesesHtml += `
                    <div class="gantt-month" style="left:${i * anchoDia}px;">
                        ${mes.charAt(0).toUpperCase() + mes.slice(1)}
                    </div>
                `;
            }
        }

        let filasHtml = "";

        maquinas.forEach(grupo => {
            let barrasHtml = "";

            grupo.tareas.forEach(tarea => {
                const inicio = new Date(tarea.inicio);
                const fin = new Date(tarea.fin);

                const offsetDias = Math.round((inicio - minFecha) / MS_DIA);
                const duracionDias = Math.max(1, Math.round((fin - inicio) / MS_DIA));

                barrasHtml += `
                    <div 
                        class="gantt-machine-bar ${tarea.claseEstado}"
                        style="
                            left:${offsetDias * anchoDia}px;
                            width:${duracionDias * anchoDia}px;
                        ">
                        ${tarea.producto} (${tarea.pedido})
                    </div>
                `;
            });

            filasHtml += `
                <div class="gantt-machine-timeline-row">
                    ${barrasHtml}
                </div>
            `;
        });

        cont.innerHTML = `
            <div class="gantt-machine-pro" style="width:${(totalDias + 1) * anchoDia}px;">
                <div class="gantt-machine-calendar">
                    <div class="gantt-months">${mesesHtml}</div>
                    <div class="gantt-days">${diasHtml}</div>
                </div>

                <div class="gantt-machine-body">
                    ${filasHtml}
                </div>
            </div>
        `;

    } catch (error) {
        console.error("❌ Error cargando Gantt por máquina:", error);
        cont.innerHTML = "Error cargando Gantt por máquina";
    }
};