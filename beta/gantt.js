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
   CLASE POR ESTADO
========================= */
function obtenerClaseEstado(progress, item, fin){
    const tiempoMuerto = parseFloat(item.tiempo_muerto || 0);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaInicio = fechaLocal(item.fecha);
    const fechaFin = fechaLocal(fin);

    if (!fechaInicio || !fechaFin) {
        return "gantt-pendiente";
    }

    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(0, 0, 0, 0);

    // Tiempo muerto tiene prioridad visual
    if (tiempoMuerto > 0) {
        return "gantt-tiempo-muerto";
    }

    // Si aún no inicia
    if (hoy < fechaInicio) {
        return "gantt-pendiente";
    }

    // Si ya pasó la fecha fin
    if (hoy > fechaFin) {
        return "gantt-atrasado";
    }

    // Si está entre inicio y fin
    return "gantt-proceso";
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

/* =========================
   SIDEBAR GANTT NORMAL
========================= */
function renderGanttSidebar(tareasSidebar) {
    const sidebar = document.getElementById("gantt-sidebar");
    if (!sidebar) return;

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
   GANTT NORMAL FRAPPE
========================= */
window.mostrarGantt = async function(){

    esperarGantt(async () => {

        const cont = document.getElementById("gantt");
        const sidebar = document.getElementById("gantt-sidebar");

        if (!cont) return;

        cont.innerHTML = "Cargando Gantt...";
        if (sidebar) sidebar.innerHTML = "";

        try {
            const response = await fetch("php/obtener_produccion.php");
            const data = await response.json();

            if (!data.success || !data.data || !data.data.length) {
                cont.innerHTML = "No hay datos para generar la carta Gantt";
                return;
            }

            data.data.sort((a, b) => {
                const fechaA = fechaLocal(a.fecha) || new Date(9999, 11, 31);
                const fechaB = fechaLocal(b.fecha) || new Date(9999, 11, 31);
                return fechaA - fechaB;
            });

            const tareasSidebar = [];

            const tareas = data.data.map((item, index) => {
                let inicio = fechaParaGantt(item.fecha);
                let fin = fechaParaGantt(item.fecha_fin);

                if (!inicio) inicio = fechaParaGantt(new Date());

                if (!fin) {
                    let dias = parseInt(item.dias);
                    if (isNaN(dias) || dias <= 0) dias = 1;
                    fin = sumarDias(inicio, dias);
                }

                if (!fin) fin = sumarDias(inicio, 1);

                if (fechaLocal(inicio) > fechaLocal(fin)) {
                    fin = sumarDias(inicio, 1);
                }

                const progress = calcularProgreso(inicio, fin);
                const claseEstado = obtenerClaseEstado(progress, item, fin);

                const producto = item.producto || "Sin nombre";
                const pedido = item.numero_pedido || "-";
                const maquina = item.maquina || item.maquinas || item.nombre_maquina || "Sin máquina";
                const operador = item.operador || item.usuario || item.usuario_nombre || "Admin";

                tareasSidebar.push({ producto, pedido, maquina, operador, claseEstado });

                return {
                    id: String(item.id || index + 1),
                    name: `${producto} (${pedido})`,
                    start: inicio,
                    end: fin,
                    progress,
                    dependencies: "",
                    custom_class: claseEstado
                };
            });

            const tareasValidas = tareas.filter(tarea => {
                return tarea.start &&
                       tarea.end &&
                       !isNaN(fechaLocal(tarea.start)?.getTime()) &&
                       !isNaN(fechaLocal(tarea.end)?.getTime());
            });

            const sidebarValidas = tareasSidebar.filter((_, index) => tareasValidas[index]);

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

        } catch (error) {
            console.error("❌ Error al generar la Carta Gantt:", error);
            cont.innerHTML = "Error al generar la carta Gantt";
        }

    });
};

function abrirDetalleGantt(producto, pedido, inicio, fin, maquina, estado, operador = "Admin"){

    const modal = document.getElementById("modalDetalleGantt");

    if (!modal) {
        console.warn("No existe #modalDetalleGantt");
        return;
    }

    const estadoTexto = estado.replace("gantt-", "").replace("-", " ");

    document.getElementById("detalleGanttProducto").textContent = producto;
    document.getElementById("detalleGanttPedido").textContent = `Nota de venta: ${pedido}`;
    document.getElementById("detalleGanttInicio").textContent = inicio;
    document.getElementById("detalleGanttFin").textContent = fin;
    document.getElementById("detalleGanttMaquina").textContent = maquina;
    document.getElementById("detalleGanttOperador").textContent = operador;

    const badge = document.getElementById("detalleGanttEstado");
    badge.textContent = estadoTexto;
    badge.className = `modal-gantt-badge ${estado}`;

    modal.classList.add("active");
}

function cerrarDetalleGantt(){
    const modal = document.getElementById("modalDetalleGantt");
    if (modal) modal.classList.remove("active");
}

/* =========================
   GANTT POR MÁQUINA AVANZADO
========================= */
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

            if (!fin) fin = sumarDias(inicio, 1);

            if (fechaLocal(inicio) > fechaLocal(fin)) {
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

        const fechas = registros
            .flatMap(r => [fechaLocal(r.inicio), fechaLocal(r.fin)])
            .filter(Boolean);

        const minFecha = new Date(Math.min(...fechas));
        const maxFecha = new Date(Math.max(...fechas));

        minFecha.setDate(minFecha.getDate() - 2);
        maxFecha.setDate(maxFecha.getDate() + 4);

        const MS_DIA = 1000 * 60 * 60 * 24;
        const totalDias = Math.floor((maxFecha - minFecha) / MS_DIA);
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
            grupo.tareas.sort((a, b) => fechaLocal(a.inicio) - fechaLocal(b.inicio));
        });

        const maquinas = Object.values(agrupado).sort((a, b) => {
            return a.maquina.localeCompare(b.maquina);
        });

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
                const inicio = fechaLocal(tarea.inicio);
                const fin = fechaLocal(tarea.fin);

                const offsetDias = Math.floor((inicio - minFecha) / MS_DIA);

                /*
                   +1 para que visualmente incluya el día de término.
                   Ej: 03/05 a 05/05 ocupa 03, 04 y 05.
                */
                const duracionDias = Math.max(
                    1,
                    Math.floor((fin - inicio) / MS_DIA) + 1
                );

                barrasHtml += `
                        <div
                            class="gantt-machine-bar ${tarea.claseEstado}"
                            onclick="abrirDetalleGantt('${tarea.producto}', '${tarea.pedido}', '${tarea.inicio}', '${tarea.fin}', '${tarea.maquina}', '${tarea.claseEstado}', '${grupo.operador}')"
                            style="
                                left:${offsetDias * anchoDia}px;
                                width:${duracionDias * anchoDia}px;
                            "
                        >
                            ${tarea.producto}
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