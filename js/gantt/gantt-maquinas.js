/* =========================
   GANTT POR MÁQUINA AVANZADO
========================= */


/* =========================
   PARSEAR DETALLE DE MÁQUINAS
========================= */
function parsearMaquinasDetalleGantt(item){

    if (item.maquinas_detalle && item.maquinas_detalle.trim() !== "") {

        return item.maquinas_detalle
            .split("||")
            .map((detalle, index) => {

                const partes = detalle.split("::");

                return {
                    idProduccionMaquina: Number(partes[0] || 0),
                    idMaquina: Number(partes[1] || 0),
                    maquina: partes[2] || "Sin máquina",
                    zona: partes[3] || "",
                    ordenProceso: Number(partes[4] || index + 1),
                    horas: Number(partes[5] || 0),
                    minutos: Number(partes[6] || 0)
                };
            })
            .filter(m => m.maquina && m.maquina !== "Sin máquina");
    }

    /*
        Fallback por seguridad:
        si maquinas_detalle no existe, usamos maquinas_utilizadas
        para no romper el Gantt actual.
    */
    if (item.maquinas_utilizadas && item.maquinas_utilizadas !== "Sin máquina") {
        return item.maquinas_utilizadas
            .split("||")
            .map((maquina, index) => {
                return {
                    idProduccionMaquina: 0,
                    idMaquina: 0,
                    maquina: maquina.trim(),
                    zona: "",
                    ordenProceso: index + 1,
                    horas: 0,
                    minutos: 0
                };
            })
            .filter(m => m.maquina !== "");
    }

    if (item.maquina) {
        return [{
            idProduccionMaquina: 0,
            idMaquina: 0,
            maquina: item.maquina,
            zona: "",
            ordenProceso: 1,
            horas: 0,
            minutos: 0
        }];
    }

    return [{
        idProduccionMaquina: 0,
        idMaquina: 0,
        maquina: "Sin máquina",
        zona: "",
        ordenProceso: 1,
        horas: 0,
        minutos: 0
    }];
}


/* =========================
   COLA VISUAL POR MÁQUINA
========================= */
function diasEntreFechasGantt(inicioTexto, finTexto){

    const inicio = fechaLocal(inicioTexto);
    const fin = fechaLocal(finTexto);

    if (!inicio || !fin) return 1;

    inicio.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);

    const MS_DIA = 1000 * 60 * 60 * 24;

    return Math.max(
        1,
        Math.floor((fin - inicio) / MS_DIA) + 1
    );
}

function sumarDiasFechaGantt(fechaTexto, dias){

    const fecha = fechaLocal(fechaTexto);

    if (!fecha) return fechaTexto;

    fecha.setDate(fecha.getDate() + dias);

    return fechaParaGantt(fecha);
}

/*
    Fallback local:
    se usa solo si hayChoqueFechas() no está disponible desde gantt-utils.js.
*/
function hayChoqueFechasGanttSeguro(inicioA, finA, inicioB, finB) {

    if (typeof hayChoqueFechas === "function") {
        return hayChoqueFechas(inicioA, finA, inicioB, finB);
    }

    const aInicio = fechaLocal(inicioA);
    const aFin = fechaLocal(finA);
    const bInicio = fechaLocal(inicioB);
    const bFin = fechaLocal(finB);

    if (!aInicio || !aFin || !bInicio || !bFin) {
        return false;
    }

    aInicio.setHours(0, 0, 0, 0);
    aFin.setHours(0, 0, 0, 0);
    bInicio.setHours(0, 0, 0, 0);
    bFin.setHours(0, 0, 0, 0);

    return aInicio <= bFin && bInicio <= aFin;
}

function aplicarColaPorMaquinaGantt(registros){

    const ocupacionPorMaquina = {};

    registros.forEach(tarea => {

        const maquina = tarea.maquina || "Sin máquina";

        if (!ocupacionPorMaquina[maquina]) {
            ocupacionPorMaquina[maquina] = [];
        }

        ocupacionPorMaquina[maquina].push(tarea);
    });

    Object.values(ocupacionPorMaquina).forEach(tareasMaquina => {

        tareasMaquina.sort((a, b) => {

            /*
                Cola por máquina:
                primero se respeta lo que ya estaba registrado antes.
                Esto evita que un producto nuevo/modificado se ponga delante
                de trabajos que ya estaban programados en esa máquina.
            */
            const diferenciaRegistro =
                (a.idProduccionMaquina || 999999) - (b.idProduccionMaquina || 999999);

            if (diferenciaRegistro !== 0) {
                return diferenciaRegistro;
            }

            const fechaA = fechaLocal(a.inicio);
            const fechaB = fechaLocal(b.inicio);

            const diferenciaFecha = fechaA - fechaB;

            if (diferenciaFecha !== 0) {
                return diferenciaFecha;
            }

            const diferenciaOrden =
                (a.ordenProceso || 999) - (b.ordenProceso || 999);

            if (diferenciaOrden !== 0) {
                return diferenciaOrden;
            }

            return (a.id || 0) - (b.id || 0);
        });

        const tareasProgramadas = [];

        tareasMaquina.forEach(tarea => {

            const inicioActual = fechaLocal(tarea.inicio);
            const finActual = fechaLocal(tarea.fin);

            if (!inicioActual || !finActual) return;

            inicioActual.setHours(0, 0, 0, 0);
            finActual.setHours(0, 0, 0, 0);

            const duracionDias = diasEntreFechasGantt(tarea.inicio, tarea.fin);

            const conflicto = tareasProgramadas.find(tareaProgramada => {
                return hayChoqueFechasGanttSeguro(
                    tarea.inicio,
                    tarea.fin,
                    tareaProgramada.inicio,
                    tareaProgramada.fin
                );
            });

            if (conflicto) {

                const inicioOriginal = tarea.inicio;
                const finOriginal = tarea.fin;

                const conflictoFin = fechaLocal(conflicto.fin);

                if (!conflictoFin) return;

                conflictoFin.setHours(0, 0, 0, 0);
                conflictoFin.setDate(conflictoFin.getDate() + 1);

                const nuevoInicio = fechaParaGantt(conflictoFin);
                const nuevoFin = sumarDiasFechaGantt(nuevoInicio, duracionDias - 1);

                tarea.inicio = nuevoInicio;
                tarea.fin = nuevoFin;

                tarea.reprogramado = true;
                tarea.motivoReprogramacion = `La máquina ${tarea.maquina} ya tenía trabajos programados.`;

                tarea.inicioOriginal = inicioOriginal;
                tarea.finOriginal = finOriginal;
                tarea.nuevoInicio = nuevoInicio;
                tarea.nuevoFin = nuevoFin;
            }

            tareasProgramadas.push({
                inicio: tarea.inicio,
                fin: tarea.fin
            });
        });
    });

    return registros;
}


/* =========================
   CACHE LOCAL GANTT MÁQUINAS
========================= */

/*
    Se usa window para evitar errores si el archivo se carga más de una vez
    dentro de la SPA.
*/
window.GANTT_MAQUINAS_CACHE_KEY =
    window.GANTT_MAQUINAS_CACHE_KEY || "ironix_gantt_maquinas_cache_v1";

window.GANTT_MAQUINAS_DIRTY_KEY =
    window.GANTT_MAQUINAS_DIRTY_KEY || "ironix_gantt_maquinas_dirty_v1";

function guardarCacheGanttMaquinas(data) {
    try {
        const payload = {
            guardadoEn: new Date().toISOString(),
            data
        };

        localStorage.setItem(
            window.GANTT_MAQUINAS_CACHE_KEY,
            JSON.stringify(payload)
        );

        localStorage.removeItem(window.GANTT_MAQUINAS_DIRTY_KEY);

    } catch (error) {
        console.warn("No se pudo guardar la caché del Gantt:", error);
    }
}

function obtenerCacheGanttMaquinas() {
    try {
        const cache = localStorage.getItem(window.GANTT_MAQUINAS_CACHE_KEY);

        if (!cache) return null;

        const payload = JSON.parse(cache);

        if (!payload || !payload.data || !payload.data.success) {
            return null;
        }

        return payload;

    } catch (error) {
        console.warn("Caché Gantt inválida, se limpiará:", error);
        localStorage.removeItem(window.GANTT_MAQUINAS_CACHE_KEY);
        return null;
    }
}

function marcarGanttMaquinasDesactualizado() {
    localStorage.setItem(window.GANTT_MAQUINAS_DIRTY_KEY, "1");
}

function ganttMaquinasEstaDesactualizado() {
    return localStorage.getItem(window.GANTT_MAQUINAS_DIRTY_KEY) === "1";
}

function limpiarCacheGanttMaquinas() {
    localStorage.removeItem(window.GANTT_MAQUINAS_CACHE_KEY);
    localStorage.removeItem(window.GANTT_MAQUINAS_DIRTY_KEY);
}

window.marcarGanttMaquinasDesactualizado = marcarGanttMaquinasDesactualizado;
window.ganttMaquinasEstaDesactualizado = ganttMaquinasEstaDesactualizado;
window.limpiarCacheGanttMaquinas = limpiarCacheGanttMaquinas;


/* =========================
   LOADING ESTABLE GANTT
========================= */
function renderLoadingGanttMaquina(cont, sidebar){

    if (sidebar) {
        sidebar.innerHTML = `
            <div class="gantt-side-head machine-mode">
                <strong>Máquina</strong>
                <strong>Operador</strong>
            </div>

            <div class="gantt-side-row machine-mode gantt-loading-row">
                <div class="gantt-side-producto">
                    <span class="gantt-color-dot machine-dot"></span>
                    <div>
                        <strong>Cargando...</strong>
                        <small>Preparando datos</small>
                    </div>
                </div>
                <div>--</div>
            </div>

            <div class="gantt-side-row machine-mode gantt-loading-row">
                <div class="gantt-side-producto">
                    <span class="gantt-color-dot machine-dot"></span>
                    <div>
                        <strong>Cargando...</strong>
                        <small>Preparando datos</small>
                    </div>
                </div>
                <div>--</div>
            </div>

            <div class="gantt-side-row machine-mode gantt-loading-row">
                <div class="gantt-side-producto">
                    <span class="gantt-color-dot machine-dot"></span>
                    <div>
                        <strong>Cargando...</strong>
                        <small>Preparando datos</small>
                    </div>
                </div>
                <div>--</div>
            </div>
        `;
    }

    cont.innerHTML = `
        <div class="gantt-machine-pro gantt-machine-loading" style="width:1200px;">
            <div class="gantt-machine-calendar">
                <div class="gantt-months">
                    <div class="gantt-month" style="left:360px;">Cargando</div>
                </div>

                <div class="gantt-days">
                    <div class="gantt-day">--</div>
                    <div class="gantt-day">--</div>
                    <div class="gantt-day">--</div>
                    <div class="gantt-day">--</div>
                    <div class="gantt-day">--</div>
                    <div class="gantt-day">--</div>
                    <div class="gantt-day">--</div>
                    <div class="gantt-day">--</div>
                    <div class="gantt-day">--</div>
                    <div class="gantt-day">--</div>
                    <div class="gantt-day">--</div>
                    <div class="gantt-day">--</div>
                </div>
            </div>

            <div class="gantt-machine-body">
                <div class="gantt-machine-timeline-row">
                    <div class="gantt-loading-bar" style="left:180px; width:280px;"></div>
                </div>

                <div class="gantt-machine-timeline-row">
                    <div class="gantt-loading-bar" style="left:260px; width:340px;"></div>
                </div>

                <div class="gantt-machine-timeline-row">
                    <div class="gantt-loading-bar" style="left:120px; width:220px;"></div>
                </div>
            </div>
        </div>
    `;
}


/* =========================
   MOSTRAR GANTT POR MÁQUINA
========================= */
window.mostrarGanttPorMaquina = async function(forzarActualizar = false){

    const cont = document.getElementById("gantt");
    const sidebar = document.getElementById("gantt-sidebar");

    if (!cont) return;

    try {
        let data = null;

        const ganttYaRenderizado =
            cont.querySelector(".gantt-machine-pro") !== null;

        /*
            Si no se fuerza actualización,
            primero se intenta cargar la última versión guardada.
        */
        if (!forzarActualizar) {
            const cache = obtenerCacheGanttMaquinas();

            if (cache) {
                data = cache.data;
                window.ganttMaquinasUltimaActualizacion = cache.guardadoEn;
            }
        }

        /*
            Si no existe caché, recién ahí se consulta al servidor.
            Esto pasa la primera vez o al presionar Actualizar.
        */
        if (!data) {
            if (!ganttYaRenderizado) {
                renderLoadingGanttMaquina(cont, sidebar);
            }

            const response = await fetch("php/produccion/obtener_produccion.php");
            data = await response.json();

            if (data.success && data.data && data.data.length) {
                guardarCacheGanttMaquinas(data);
                window.ganttMaquinasUltimaActualizacion = new Date().toISOString();
            }
        }

        if (!data.success || !data.data || !data.data.length) {
            cont.innerHTML = "No hay datos";

            if (sidebar) {
                sidebar.innerHTML = "";
            }

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

            const maquinasDetalle = parsearMaquinasDetalleGantt(item);

            return maquinasDetalle.map(detalle => {
                return {
                    id: item.id,
                    producto: item.producto || "Sin nombre",
                    pedido: item.numero_pedido || "-",

                    maquina: detalle.maquina,
                    maquinasUtilizadas: maquinasDetalle
                        .map(m => m.maquina)
                        .join(", "),

                    operador: item.usuario || "Admin",
                    inicio,
                    fin,
                    claseEstado,

                    idProduccionMaquina: detalle.idProduccionMaquina,
                    idMaquina: detalle.idMaquina,
                    zona: detalle.zona,
                    ordenProceso: detalle.ordenProceso,
                    horasMaquina: detalle.horas,
                    minutosMaquina: detalle.minutos,

                    inicioOriginal: inicio,
                    finOriginal: fin,
                    reprogramado: false,
                    motivoReprogramacion: "",

                    estaAtrasado: item.esta_atrasado === true,
                    fechaEstimada: item.fecha_fin || fin,
                    fechaReal: item.fecha_fin_real || "",
                    fechaActualEstado: item.fecha_estado_actual || ""
                };
            });
        });

        aplicarColaPorMaquinaGantt(registros);

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

        window.ganttFechaMinima = minFecha;
        window.ganttAnchoDia = anchoDia;

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

                const diferenciaFecha =
                    fechaLocal(a.inicio) - fechaLocal(b.inicio);

                if (diferenciaFecha !== 0) {
                    return diferenciaFecha;
                }

                const diferenciaOrden =
                    (a.ordenProceso || 999) - (b.ordenProceso || 999);

                if (diferenciaOrden !== 0) {
                    return diferenciaOrden;
                }

                return (a.idProduccionMaquina || 0) - (b.idProduccionMaquina || 0);
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

                const claseAlertas = [
                    tarea.estaAtrasado ? "gantt-alerta-atraso-activa" : "",
                    tarea.reprogramado ? "gantt-alerta-reprogramado-activa" : ""
                ].filter(Boolean).join(" ");

                const opcionesDetalle = {
                    producto: tarea.producto,
                    maquina: tarea.maquina,
                    inicio: tarea.inicio,
                    fin: tarea.fin,

                    estaAtrasado: tarea.estaAtrasado === true,
                    reprogramado: tarea.reprogramado === true,

                    fechaEstimada: tarea.fechaEstimada || tarea.finOriginal || tarea.fin,
                    fechaReal: tarea.fechaReal || "",
                    fechaActual: tarea.fechaActualEstado || "",

                    inicioOriginal: tarea.inicioOriginal || tarea.inicio,
                    finOriginal: tarea.finOriginal || tarea.fin,
                    nuevoInicio: tarea.nuevoInicio || tarea.inicio,
                    nuevoFin: tarea.nuevoFin || tarea.fin,

                    motivoReprogramacion: tarea.motivoReprogramacion || ""
                };

                const opcionesDetalleJson = encodeURIComponent(
                    JSON.stringify(opcionesDetalle)
                );

                const iconosAlertas = `
                    <button
                        type="button"
                        class="gantt-alertas-barra"
                        onclick="abrirModalAlertasGantt(
                            event,
                            JSON.parse(decodeURIComponent('${opcionesDetalleJson}'))
                        )"
                        title="Ver alertas"
                    >
                        ${tarea.estaAtrasado ? `<span class="gantt-alerta-icon alerta-atraso">⚠</span>` : ""}
                        ${tarea.reprogramado ? `<span class="gantt-alerta-icon alerta-reprogramado">↻</span>` : ""}
                    </button>
                `;

                barrasHtml += `
                    <div
                        class="gantt-machine-bar ${tarea.claseEstado} ${claseAlertas}"
                        onclick="abrirDetalleGantt(
                            '${tarea.producto}',
                            '${tarea.pedido}',
                            '${tarea.inicio}',
                            '${tarea.fin}',
                            '${tarea.maquina}',
                            '${tarea.claseEstado}',
                            '${grupo.operador}',
                            '${tarea.maquinasUtilizadas}',
                            JSON.parse(decodeURIComponent('${opcionesDetalleJson}'))
                        )"
                        style="
                            left:${offsetDias * anchoDia}px;
                            width:${duracionDias * anchoDia}px;
                        "
                    >
                        <span class="gantt-bar-texto">${tarea.producto}</span>
                        ${iconosAlertas}
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


/* =========================
   IR A HOY EN GANTT
========================= */
function irHoyGantt(){

    const cont = document.getElementById("gantt");

    if (!cont || !window.ganttFechaMinima || !window.ganttAnchoDia) {
        console.warn("No hay datos suficientes para centrar Hoy en Gantt");
        return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaMinima = new Date(window.ganttFechaMinima);
    fechaMinima.setHours(0, 0, 0, 0);

    const MS_DIA = 1000 * 60 * 60 * 24;
    const diasDesdeInicio = Math.floor((hoy - fechaMinima) / MS_DIA);

    if (diasDesdeInicio < 0) {
        cont.scrollLeft = 0;
        return;
    }

    const posicionHoy = diasDesdeInicio * window.ganttAnchoDia;

    cont.scrollTo({
        left: Math.max(posicionHoy - cont.clientWidth / 2, 0),
        behavior: "smooth"
    });
}

window.irHoyGantt = irHoyGantt;


/* =========================
   ACTUALIZAR GANTT
========================= */
async function actualizarGantt(){

    if (typeof cerrarPanelAccionesGantt === "function") {
        cerrarPanelAccionesGantt();
    }

    if (typeof mostrarGanttPorMaquina === "function") {
        await mostrarGanttPorMaquina(true);
    }

    setTimeout(() => {
        if (typeof irHoyGantt === "function") {
            irHoyGantt();
        }
    }, 150);
}

window.actualizarGantt = actualizarGantt;