/* =========================
   GANTT POR MÁQUINA AVANZADO
========================= */
window.mostrarGanttPorMaquina = async function(){

    console.log("🔥 GANTT POR MÁQUINA AVANZADO");

    const cont = document.getElementById("gantt");
    const sidebar = document.getElementById("gantt-sidebar");

    if (!cont) return;

    cont.innerHTML = "Cargando Gantt por máquina...";

    if (sidebar) {
        sidebar.innerHTML = "";
    }

    try {
        const response = await fetch("php/produccion/obtener_produccion.php");
        const data = await response.json();

        if (!data.success || !data.data || !data.data.length) {
            cont.innerHTML = "No hay datos";
            return;
        }

        const registros = data.data.flatMap(item => {
            let inicio = fechaParaGantt(item.fecha);
            let fin = fechaParaGantt(item.fecha_fin);

            if (!inicio) {
                inicio = fechaParaGantt(new Date());
            }

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

            if (fechaLocal(inicio) > fechaLocal(fin)) {
                fin = sumarDias(inicio, 1);
            }

            const progress = calcularProgreso(inicio, fin);
            const claseEstado = obtenerClaseEstado(progress, item, fin);

            let maquinas = [];

            if (item.maquinas_utilizadas && item.maquinas_utilizadas !== "Sin máquina") {
                maquinas = item.maquinas_utilizadas
                    .split("||")
                    .map(maquina => maquina.trim())
                    .filter(maquina => maquina !== "");
            }

            if (!maquinas.length && item.maquina) {
                maquinas = [item.maquina];
            }

            if (!maquinas.length) {
                maquinas = ["Sin máquina"];
            }

            return maquinas.map(maquina => {
                return {
                    id: item.id,
                    producto: item.producto || "Sin nombre",
                    pedido: item.numero_pedido || "-",
                    maquina: maquina,
                    maquinasUtilizadas: maquinas.join(", "),
                    operador: item.usuario || "Admin",
                    inicio,
                    fin,
                    claseEstado
                };
            });
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
            grupo.tareas.sort((a, b) => {
                return fechaLocal(a.inicio) - fechaLocal(b.inicio);
            });
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
                        <span class="gantt-color-dot machine-dot"></span>
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

            const mes = fecha.toLocaleDateString("es-CL", {
                month: "long"
            });

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

                const duracionDias = Math.max(
                    1,
                    Math.floor((fin - inicio) / MS_DIA) + 1
                );

                barrasHtml += `
                    <div
                        class="gantt-machine-bar ${tarea.claseEstado}"
                        onclick="abrirDetalleGantt('${tarea.producto}', '${tarea.pedido}', '${tarea.inicio}', '${tarea.fin}', '${tarea.maquina}', '${tarea.claseEstado}', '${grupo.operador}', '${tarea.maquinasUtilizadas}')"
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