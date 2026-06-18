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

function obtenerClaveMaquinaGantt(tarea) {

    const idMaquina = Number(tarea.idMaquina || 0);

    if (idMaquina > 0) {
        return `maquina-id-${idMaquina}`;
    }

    const zona = String(tarea.zona || "")
        .trim()
        .toLowerCase();

    const nombreMaquina = String(tarea.maquina || "Sin máquina")
        .trim()
        .toLowerCase();

    return `maquina-nombre-${zona}-${nombreMaquina}`;
}

function aplicarColaPorMaquinaGantt(registros){

    const ocupacionPorMaquina = {};

    registros.forEach(tarea => {

        const claveMaquina = obtenerClaveMaquinaGantt(tarea);

        if (!ocupacionPorMaquina[claveMaquina]) {
            ocupacionPorMaquina[claveMaquina] = [];
        }

        ocupacionPorMaquina[claveMaquina].push(tarea);
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

            const inicioOriginal = tarea.inicio;
            const finOriginal = tarea.fin;
            const duracionDias = Math.max(
                1,
                Number(tarea.duracionOriginalDias) || diasEntreFechasGantt(tarea.inicio, tarea.fin)
            );

            let inicioPropuesto = tarea.inicio;
            let finPropuesto = tarea.fin;
            let fueReprogramada = false;
            let ultimoConflicto = null;

            /*
                Busca el primer espacio libre real.
                Si al mover la tarea vuelve a chocar con otra,
                sigue avanzando solo lo necesario.
            */
            while (true) {

                const conflicto = tareasProgramadas.find(tareaProgramada => {
                    return hayChoqueFechasGanttSeguro(
                        inicioPropuesto,
                        finPropuesto,
                        tareaProgramada.inicio,
                        tareaProgramada.fin
                    );
                });

                if (!conflicto) {
                    break;
                }

                ultimoConflicto = conflicto;

                const conflictoFin = fechaLocal(conflicto.fin);

                if (!conflictoFin) {
                    break;
                }

                conflictoFin.setHours(0, 0, 0, 0);
                conflictoFin.setDate(conflictoFin.getDate() + 1);

                inicioPropuesto = fechaParaGantt(conflictoFin);
                finPropuesto = sumarDiasFechaGantt(inicioPropuesto, duracionDias - 1);

                fueReprogramada = true;
            }

            if (fueReprogramada) {

                tarea.inicio = inicioPropuesto;
                tarea.fin = finPropuesto;

                tarea.reprogramado = true;
                tarea.motivoReprogramacion = ultimoConflicto
                    ? `La máquina ${tarea.maquina} ya tenía trabajos programados entre ${ultimoConflicto.inicio} y ${ultimoConflicto.fin}.`
                    : `La máquina ${tarea.maquina} ya tenía trabajos programados.`;

                tarea.inicioOriginal = inicioOriginal;
                tarea.finOriginal = finOriginal;
                tarea.nuevoInicio = inicioPropuesto;
                tarea.nuevoFin = finPropuesto;
            }

            tareasProgramadas.push({
                inicio: tarea.inicio,
                fin: tarea.fin
            });

            tareasProgramadas.sort((a, b) => {
                return fechaLocal(a.inicio) - fechaLocal(b.inicio);
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

function guardarCacheGanttMaquinas(data, versionBackend = null) {
    try {
        const payload = {
            guardadoEn: new Date().toISOString(),

            version: versionBackend ? Number(versionBackend.version || 0) : 0,
            actualizadoEnBackend: versionBackend ? versionBackend.actualizadoEn || "" : "",

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

        payload.version = Number(payload.version || 0);
        payload.actualizadoEnBackend = payload.actualizadoEnBackend || "";

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
   VERSION BACKEND GANTT
========================= */
window.obtenerVersionGanttBackend = window.obtenerVersionGanttBackend || async function(){

    try {
        const response = await fetch("php/gantt/obtener_version_gantt.php", {
            cache: "no-store"
        });

        const data = await response.json();

        if (!data.success) {
            console.warn("No se pudo obtener la versión del Gantt:", data.message || data);
            return null;
        }

        return {
            modulo: data.modulo || "gantt_maquinas",
            version: Number(data.version || 0),
            actualizadoEn: data.actualizado_en || ""
        };

    } catch (error) {
        console.warn("Error consultando versión backend del Gantt:", error);
        return null;
    }
};


/* =========================
   VERSION BACKEND GANTT
========================= */
async function obtenerVersionGanttBackend(){

    try {
        const response = await fetch("php/gantt/obtener_version_gantt.php", {
            cache: "no-store"
        });

        const data = await response.json();

        if (!data.success) {
            console.warn("No se pudo obtener la versión del Gantt:", data.message || data);
            return null;
        }

        return {
            modulo: data.modulo || "gantt_maquinas",
            version: Number(data.version || 0),
            actualizadoEn: data.actualizado_en || ""
        };

    } catch (error) {
        console.warn("Error consultando versión backend del Gantt:", error);
        return null;
    }
}


/* =========================
   AVISO VERSION GANTT
========================= */
function ocultarAvisoVersionGantt() {
    const aviso = document.getElementById("gantt-version-alerta");

    if (aviso) {
        aviso.remove();
    }
}


function obtenerPuntoInsercionAvisoGantt() {

    /*
        Inserta la alerta FUERA del header,
        justo debajo del título/botones y antes de la leyenda.
    */
    const headerGantt = document.querySelector("#documentacion .gantt-header") ||
                        document.querySelector(".gantt-header");

    if (headerGantt && headerGantt.parentElement) {
        return {
            padre: headerGantt.parentElement,
            antesDe: headerGantt.nextElementSibling
        };
    }

    const leyendaGantt = document.querySelector("#documentacion .gantt-leyenda") ||
                         document.querySelector(".gantt-leyenda");

    if (leyendaGantt && leyendaGantt.parentElement) {
        return {
            padre: leyendaGantt.parentElement,
            antesDe: leyendaGantt
        };
    }

    const panelGantt = document.querySelector("#documentacion .gantt-panel") ||
                       document.querySelector(".gantt-panel");

    if (panelGantt) {
        return {
            padre: panelGantt,
            antesDe: panelGantt.firstElementChild
        };
    }

    console.warn("No se encontró punto válido para insertar aviso de versión Gantt.");
    return null;
}


function mostrarAvisoVersionGantt(versionCache, versionBackend, actualizadoEn = "") {

    const puntoInsercion = obtenerPuntoInsercionAvisoGantt();

    if (!puntoInsercion) {
        console.warn("No se pudo insertar el aviso de versión Gantt.");
        return;
    }

    let aviso = document.getElementById("gantt-version-alerta");

    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "gantt-version-alerta";
        aviso.className = "gantt-version-alerta-header";

        puntoInsercion.padre.insertBefore(aviso, puntoInsercion.antesDe);
    }

    const textoFecha = actualizadoEn
        ? `Último cambio detectado: ${actualizadoEn}`
        : `Hay cambios nuevos disponibles.`;

    aviso.innerHTML = `
        <div class="gantt-version-alerta-icono">!</div>

        <div class="gantt-version-alerta-texto">
            <strong>Datos pendientes de sincronizar</strong>
            <div class="gantt-version-alerta-detalle">
                <span>Versión local ${versionCache || 0} / Actual ${versionBackend || 0}</span>
                <span class="gantt-version-alerta-separador">•</span>
                <small>${textoFecha}</small>
            </div>
        </div>

        <div class="gantt-version-alerta-acciones">
            <button 
                type="button"
                class="btn-sincronizar-version-gantt"
                onclick="sincronizarDatosDesdeAvisoGantt(this)">
                Sincronizar datos
            </button>
        </div>
    `;
}


async function sincronizarDatosDesdeAvisoGantt(boton = null) {

    try {
        if (boton) {
            boton.disabled = true;
            boton.textContent = "Sincronizando...";
        }

        if (typeof sincronizarDatosGantt === "function") {
            await sincronizarDatosGantt();
        } else if (typeof mostrarGanttPorMaquina === "function") {
            await mostrarGanttPorMaquina(true);
        } else {
            console.warn("No existe función disponible para sincronizar la Carta Gantt.");

            if (boton) {
                boton.disabled = false;
                boton.textContent = "Sincronizar datos";
            }

            return;
        }

        ocultarAvisoVersionGantt();

    } catch (error) {
        console.error("Error al sincronizar datos desde aviso Gantt:", error);

        if (boton) {
            boton.disabled = false;
            boton.textContent = "Sincronizar datos";
        }
    }
}


async function verificarVersionGanttMaquinas() {

    let versionCache = Number(window.ganttMaquinasVersionCache || 0);

    /*
        Si la versión no está cargada en memoria,
        se intenta recuperar desde localStorage.
    */
    if (!versionCache && typeof obtenerCacheGanttMaquinas === "function") {
        const cache = obtenerCacheGanttMaquinas();

        if (cache) {
            versionCache = Number(cache.version || 0);

            window.ganttMaquinasVersionCache = versionCache;
            window.ganttMaquinasUltimaActualizacion = cache.guardadoEn || "";
            window.ganttMaquinasActualizadoEnBackend = cache.actualizadoEnBackend || "";
        }
    }

    const versionBackend = await obtenerVersionGanttBackend();

    if (!versionBackend || !versionBackend.version) {
        console.warn("No se pudo validar la versión backend del Gantt.");
        return;
    }

    const versionReal = Number(versionBackend.version || 0);

    /*
        Si todavía no existe versión local,
        no se muestra alerta. Primero debe existir caché.
    */
    if (!versionCache) {
        console.warn("No existe versión local del Gantt. Sincroniza datos una vez para crear caché.");
        ocultarAvisoVersionGantt();
        return;
    }

    if (versionReal > versionCache) {
        mostrarAvisoVersionGantt(
            versionCache,
            versionReal,
            versionBackend.actualizadoEn || ""
        );
        return;
    }

    ocultarAvisoVersionGantt();
}


/* =========================
   EXPORTAR FUNCIONES GANTT
========================= */
window.obtenerVersionGanttBackend = obtenerVersionGanttBackend;
window.mostrarAvisoVersionGantt = mostrarAvisoVersionGantt;
window.ocultarAvisoVersionGantt = ocultarAvisoVersionGantt;
window.verificarVersionGanttMaquinas = verificarVersionGanttMaquinas;
window.sincronizarDatosDesdeAvisoGantt = sincronizarDatosDesdeAvisoGantt;

/* =========================
   DÍAS DE SEMANA GANTT
========================= */
function obtenerNombreDiaSemanaGantt(fecha) {
    const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return diasSemana[fecha.getDay()];
}

function esFinDeSemanaGantt(fecha) {
    const diaSemana = fecha.getDay();
    return diaSemana === 0 || diaSemana === 6;
}

/* =========================
   SÁBADO HABILITADO GANTT
========================= */
function normalizarTrabajaSabadoGantt(valor) {
    if (valor === true || valor === 1) return true;

    const texto = String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    return ["1", "si", "s", "true", "yes"].includes(texto);
}

function generarSabadosHabilitadosGlobalGantt(maquinas, minFecha, totalDias, anchoDia) {
    const sabadosHabilitados = new Set();

    const fechaBase = new Date(minFecha);
    fechaBase.setHours(0, 0, 0, 0);

    maquinas.forEach(grupo => {
        grupo.tareas.forEach(tarea => {
            if (tarea.trabajaSabado !== true) return;

            const inicio = fechaLocal(tarea.inicio);
            const fin = fechaLocal(tarea.fin);

            if (!inicio || !fin) return;

            inicio.setHours(0, 0, 0, 0);
            fin.setHours(0, 0, 0, 0);

            for (let i = 0; i <= totalDias; i++) {
                const fechaDia = new Date(fechaBase);
                fechaDia.setDate(fechaBase.getDate() + i);
                fechaDia.setHours(0, 0, 0, 0);

                const esSabado = fechaDia.getDay() === 6;

                if (!esSabado) continue;

                const tareaCruzaSabado = fechaDia >= inicio && fechaDia <= fin;

                if (tareaCruzaSabado) {
                    sabadosHabilitados.add(i);
                }
            }
        });
    });

    return Array.from(sabadosHabilitados)
        .map(i => `
            <div
                class="gantt-sabado-habilitado-column"
                title="Sábado habilitado para trabajo"
                style="
                    left:${i * anchoDia}px;
                    width:${anchoDia}px;
                "
            ></div>
        `)
        .join("");
}
/* =========================
   LOADING GANTT POR MÁQUINA
========================= */

function renderLoadingGanttMaquina(cont, sidebar) {
    if (sidebar) {
        sidebar.innerHTML = `
            <div class="gantt-side-head machine-mode">
                <strong>Máquina</strong>
                <strong>Operador</strong>
            </div>

            <div class="gantt-side-row machine-mode">
                <div class="gantt-side-producto">
                    <span class="gantt-color-dot machine-dot"></span>
                    <div class="gantt-machine-name-block">
                        <strong class="gantt-machine-name-text">Cargando...</strong>
                        <small class="gantt-machine-count-text">Preparando datos</small>
                    </div>
                </div>

                <div>...</div>
            </div>
        `;
    }

    if (cont) {
        cont.innerHTML = `
            <div class="gantt-machine-loading">
                <div style="
                    padding: 18px;
                    color: #ffffff;
                    font-weight: 700;
                    opacity: 0.85;
                ">
                    Cargando Carta Gantt...
                </div>
            </div>
        `;
    }
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
                window.ganttMaquinasVersionCache = Number(cache.version || 0);
                window.ganttMaquinasActualizadoEnBackend = cache.actualizadoEnBackend || "";
            }
        }

        /*
            Si no existe caché, recién ahí se consulta al servidor.
            Esto pasa la primera vez o al presionar Sincronizar datos.
        */
        if (!data) {
            if (!ganttYaRenderizado) {
                renderLoadingGanttMaquina(cont, sidebar);
            }

            const response = await fetch("php/produccion/obtener_produccion.php");
            data = await response.json();

            if (data.success && data.data && data.data.length) {

                const versionBackend = typeof window.obtenerVersionGanttBackend === "function"
                    ? await window.obtenerVersionGanttBackend()
                    : null;

                guardarCacheGanttMaquinas(data, versionBackend);

                window.ganttMaquinasUltimaActualizacion = new Date().toISOString();
                window.ganttMaquinasVersionCache = versionBackend
                    ? Number(versionBackend.version || 0)
                    : 0;
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

                    trabajaSabado: normalizarTrabajaSabadoGantt(item.trabaja_sabado),
                    trabajaSabadoRaw: item.trabaja_sabado,

                    duracionOriginalDias: diasEntreFechasGantt(inicio, fin),

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

                const totalProductos = grupo.tareas.length;
                const textoProductos = totalProductos === 1 ? "producto" : "productos";

                fila.innerHTML = `
                    <div class="gantt-side-producto">
                        <span class="gantt-color-dot machine-dot"></span>

                        <div class="gantt-machine-name-block">
                            <strong class="gantt-machine-name-text">${grupo.maquina}</strong>
                            <small class="gantt-machine-count-text">(${totalProductos} ${textoProductos})</small>
                        </div>
                    </div>

                    <div>${grupo.operador}</div>
                `;

                sidebar.appendChild(fila);
            });
        }

        let diasHtml = "";
        let mesesHtml = "";
        let finesSemanaHtml = "";
        let mesActual = "";

        for (let i = 0; i <= totalDias; i++) {
            const fecha = new Date(minFecha);
            fecha.setDate(minFecha.getDate() + i);

            const dia = String(fecha.getDate()).padStart(2, "0");

            const nombreDiaSemana = obtenerNombreDiaSemanaGantt(fecha);
            const claseFinDeSemana = esFinDeSemanaGantt(fecha) ? "gantt-weekend" : "";

            const mes = fecha.toLocaleDateString("es-CL", {
                month: "long"
            });

            diasHtml += `
                <div class="gantt-day ${claseFinDeSemana}">
                    <span class="gantt-day-number">${dia}</span>
                    <span class="gantt-day-name">${nombreDiaSemana}</span>
                </div>
            `;

            if (esFinDeSemanaGantt(fecha)) {
                finesSemanaHtml += `
                    <div
                        class="gantt-weekend-column"
                        style="
                            left:${i * anchoDia}px;
                            width:${anchoDia}px;
                        "
                    ></div>
                `;
            }

            if (mes !== mesActual) {
                mesActual = mes;

                mesesHtml += `
                    <div class="gantt-month" style="left:${i * anchoDia}px;">
                        ${mes.charAt(0).toUpperCase() + mes.slice(1)}
                    </div>
                `;
            }
        }

        const sabadosHabilitadosGlobalHtml = generarSabadosHabilitadosGlobalGantt(
            maquinas,
            minFecha,
            totalDias,
            anchoDia
        );

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

                const tieneAlertas =
                    tarea.estaAtrasado === true ||
                    tarea.reprogramado === true;

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

                    motivoReprogramacion: tarea.reprogramado === true
                        ? tarea.motivoReprogramacion || `La máquina ${tarea.maquina} ya tenía trabajos programados.`
                        : ""
                };

                const opcionesDetalleJson = encodeURIComponent(
                    JSON.stringify(opcionesDetalle)
                );

                const iconosAlertas = tieneAlertas ? `
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
                ` : "";

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
                    <div class="gantt-weekend-row-overlay">
                        ${finesSemanaHtml}
                        ${sabadosHabilitadosGlobalHtml}
                    </div>

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

        if (forzarActualizar) {
            ocultarAvisoVersionGantt();
        } else {
            verificarVersionGanttMaquinas();
        }

        if (typeof mostrarUltimaSincronizacionGantt === "function") {
            mostrarUltimaSincronizacionGantt();
        }

    } catch (error) {
        console.error("❌ Error cargando Gantt por máquina:", error);
        cont.innerHTML = "Error cargando Gantt por máquina";
    }
};

/* =========================
   ULTIMA SINCRONIZACION GANTT
========================= */

function formatearFechaUltimaSincronizacionGantt(fechaTexto){

    if (!fechaTexto) {
        return "Sin registro";
    }

    const fecha = new Date(fechaTexto.replace(" ", "T"));

    if (isNaN(fecha.getTime())) {
        return fechaTexto;
    }

    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const anio = fecha.getFullYear();

    const hora = String(fecha.getHours()).padStart(2, "0");
    const minuto = String(fecha.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
}


function obtenerUltimaSincronizacionGantt(){

    /*
        Primero intenta leer desde memoria.
    */
    if (window.ganttMaquinasUltimaActualizacion) {
        return window.ganttMaquinasUltimaActualizacion;
    }

    /*
        Luego intenta leer desde el caché actual del Gantt.
    */
    if (typeof obtenerCacheGanttMaquinas === "function") {
        const cache = obtenerCacheGanttMaquinas();

        if (cache && cache.guardadoEn) {
            window.ganttMaquinasUltimaActualizacion = cache.guardadoEn;
            return cache.guardadoEn;
        }
    }

    return "";
}


function mostrarUltimaSincronizacionGantt(){

    let indicador = document.getElementById("ganttUltimaSincronizacion");

    /*
        Si el indicador no existe en el HTML,
        lo crea dentro del bloque derecho del header.
    */
    if (!indicador) {
        const accionesHeader = document.querySelector(".gantt-header-actions");
        const controlesGantt = document.querySelector(".gantt-controls");

        if (!accionesHeader && !controlesGantt) {
            console.warn("No se encontró ubicación para mostrar última sincronización.");
            return;
        }

        indicador = document.createElement("div");
        indicador.id = "ganttUltimaSincronizacion";
        indicador.className = "gantt-ultima-sincronizacion";

        if (accionesHeader) {
            accionesHeader.appendChild(indicador);
        } else {
            controlesGantt.insertAdjacentElement("afterend", indicador);
        }
    }

    const ultimaSincronizacion = obtenerUltimaSincronizacionGantt();
    const textoFecha = formatearFechaUltimaSincronizacionGantt(ultimaSincronizacion);

    indicador.innerHTML = `
        <span>Última sincronización:</span>
        <strong>${textoFecha}</strong>
    `;
}


window.mostrarUltimaSincronizacionGantt = mostrarUltimaSincronizacionGantt;


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
   REFRESCAR VISTA GANTT
   Usa los datos ya cargados/cacheados
========================= */
async function refrescarVistaGantt(){

    if (typeof cerrarPanelAccionesGantt === "function") {
        cerrarPanelAccionesGantt();
    }

    if (typeof mostrarGanttPorMaquina === "function") {
        await mostrarGanttPorMaquina(false);
    }
}


/* =========================
   SINCRONIZAR DATOS GANTT
   Consulta nuevamente PHP / BD
========================= */
async function sincronizarDatosGantt(){

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


/* =========================
   COMPATIBILIDAD TEMPORAL
   Evita romper botones antiguos que aún usen actualizarGantt()
========================= */
async function actualizarGantt(){
    await sincronizarDatosGantt();
}

window.refrescarVistaGantt = refrescarVistaGantt;
window.sincronizarDatosGantt = sincronizarDatosGantt;
window.actualizarGantt = actualizarGantt;