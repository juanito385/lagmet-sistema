/* =========================
   DESCARGAR IMAGEN GANTT
========================= */
async function descargarGanttImagen() {

    /*
        Guardia frontend Fase 5:
        bloquea la exportación directa de imagen si alguien intenta ejecutar
        descargarGanttImagen() desde consola.
    */
    if (
        typeof usuarioPuedeAccionIronix === "function" &&
        !usuarioPuedeAccionIronix("documentacion", "exportar")
    ) {
        alert("No tienes permisos para exportar documentación");
        return;
    }

    const panelOriginal = document.querySelector(".gantt-panel");
    const ganttOriginal = document.getElementById("gantt");

    if (!panelOriginal || !ganttOriginal || ganttOriginal.innerHTML.trim() === "") {
        alert("Primero debes generar la Carta Gantt");
        return;
    }

    try {

        /* Cerrar panel flotante si está abierto */
        if (typeof cerrarPanelAccionesGantt === "function") {
            cerrarPanelAccionesGantt();
        }

        await new Promise(resolve => setTimeout(resolve, 150));

        /* Clonar panel completo */
        const clon = panelOriginal.cloneNode(true);

        clon.classList.add("gantt-export-clone");

        /* Quitar controles que no aportan al reporte */
        const controles = clon.querySelector(".gantt-controls");
        if (controles) {
            controles.remove();
        }

        /* Quitar panel flotante si quedó dentro del clon */
        const panelAcciones = clon.querySelector("#panelAccionesGantt");
        if (panelAcciones) {
            panelAcciones.remove();
        }

        /* Preparar estructura clonada */
        const ganttClonado = clon.querySelector("#gantt");
        const sidebarClonado = clon.querySelector("#gantt-sidebar");
        const wrapperClonado = clon.querySelector(".gantt-wrapper");
        const ganttProClonado = clon.querySelector(".gantt-machine-pro");

        const anchoGantt = ganttOriginal.scrollWidth;
        const altoGantt = ganttOriginal.scrollHeight;
        const anchoSidebar = document.getElementById("gantt-sidebar")?.offsetWidth || 400;

        if (wrapperClonado) {
            wrapperClonado.style.width = `${anchoSidebar + anchoGantt}px`;
            wrapperClonado.style.maxWidth = "none";
            wrapperClonado.style.overflow = "visible";
        }

        if (sidebarClonado) {
            sidebarClonado.style.overflow = "visible";
        }

        if (ganttClonado) {
            ganttClonado.style.width = `${anchoGantt}px`;
            ganttClonado.style.height = `${altoGantt}px`;
            ganttClonado.style.overflow = "visible";
        }

        if (ganttProClonado) {
            ganttProClonado.style.width = `${anchoGantt}px`;
        }

        /* Contenedor temporal fuera de pantalla */
        const exportWrapper = document.createElement("div");

        exportWrapper.style.position = "fixed";
        exportWrapper.style.left = "-99999px";
        exportWrapper.style.top = "0";
        exportWrapper.style.background = "#2f3040";
        exportWrapper.style.padding = "24px";
        exportWrapper.style.zIndex = "-1";
        exportWrapper.style.width = `${anchoSidebar + anchoGantt + 80}px`;

        exportWrapper.appendChild(clon);
        document.body.appendChild(exportWrapper);

        const canvas = await html2canvas(clon, {
            scale: 2,
            backgroundColor: "#2f3040",
            useCORS: true,
            logging: false,
            width: clon.scrollWidth,
            height: clon.scrollHeight,
            windowWidth: clon.scrollWidth,
            windowHeight: clon.scrollHeight
        });

        const imagen = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = imagen;
        link.download = "Carta_Gantt_IRONIX.png";
        link.click();

        document.body.removeChild(exportWrapper);

    } catch (error) {
        console.error("Error al descargar imagen:", error);
        alert("No se pudo descargar la imagen");
    }
}

/* =========================
   EXPORTAR GANTT POR MES
========================= */

function escaparTextoGantt(valor){
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function nombreMesGantt(mes){
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return meses[mes] || "Mes";
}

function medirTextoExportacionGantt(texto, font = "800 14px Arial"){

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.font = font;

    return Math.ceil(ctx.measureText(String(texto || "")).width);
}

function calcularMargenCorteExportacionGantt(nombres){

    if (!Array.isArray(nombres) || nombres.length === 0) {
        return 0;
    }

    const anchoNombreMasLargo = Math.max(
        ...nombres.map(nombre => medirTextoExportacionGantt(nombre))
    );

    /*
        70px extra considera:
        - flecha
        - separación
        - margen visual
    */
    const margenCalculado = anchoNombreMasLargo + 70;

    /*
        Límites:
        - mínimo 170px para que no quede apretado
        - máximo 420px para que no agrande demasiado la imagen
    */
    return Math.min(
        420,
        Math.max(170, margenCalculado)
    );
}

/* =========================
   SÁBADOS HABILITADOS - EXPORTACIÓN MENSUAL
========================= */

function normalizarTrabajaSabadoExportacionGantt(valor){

    if (typeof normalizarTrabajaSabadoGantt === "function") {
        return normalizarTrabajaSabadoGantt(valor);
    }

    if (valor === true || valor === 1) return true;

    const texto = String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    return ["1", "si", "sí", "s", "true", "yes"].includes(texto);
}

function generarSabadosHabilitadosMesExportacionGantt(registros, anio, mes, totalDias, anchoDia, margenIzquierda){

    const sabadosHabilitados = new Set();

    registros.forEach(tarea => {

        if (tarea.trabajaSabado !== true) return;

        const inicio = fechaLocal(tarea.inicioOriginal);
        const fin = fechaLocal(tarea.finOriginal);

        if (!inicio || !fin || isNaN(inicio.getTime()) || isNaN(fin.getTime())) return;

        inicio.setHours(0, 0, 0, 0);
        fin.setHours(0, 0, 0, 0);

        for (let dia = 1; dia <= totalDias; dia++) {

            const fechaDia = new Date(anio, mes, dia);
            fechaDia.setHours(0, 0, 0, 0);

            const esSabado = fechaDia.getDay() === 6;

            if (!esSabado) continue;

            const tareaCruzaSabado =
                fechaDia >= inicio &&
                fechaDia <= fin;

            if (tareaCruzaSabado) {
                sabadosHabilitados.add(dia);
            }
        }
    });

    const patronSabadoTrabajado = "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%228%22 height=%228%22 viewBox=%220 0 8 8%22%3E%3Cpath d=%22M-2 10 L10 -2%22 stroke=%22%2322c55e%22 stroke-width=%221.4%22 stroke-opacity=%220.34%22/%3E%3C/svg%3E')";

    return Array.from(sabadosHabilitados)
        .map(dia => {

            const left = margenIzquierda + ((dia - 1) * anchoDia);

            return `
                <div
                    class="gantt-sabado-trabajado-export-css"
                    data-dia-sabado="${dia}"
                    title="Sábado habilitado para trabajo"
                    style="
                        position:absolute !important;
                        top:0 !important;
                        bottom:0 !important;
                        left:${left}px !important;

                        width:${anchoDia}px !important;
                        min-width:${anchoDia}px !important;
                        max-width:${anchoDia}px !important;
                        height:100% !important;

                        background-color:rgba(255, 205, 210, 0.42) !important;
                        background-image:${patronSabadoTrabajado} !important;
                        background-repeat:repeat !important;
                        background-size:8px 8px !important;

                        border:none !important;
                        outline:none !important;

                        overflow:hidden !important;
                        opacity:1 !important;
                        z-index:4 !important;
                        pointer-events:none !important;
                    "
                ></div>
            `;
        })
        .join("");
}

async function exportarGanttPorMes(mes, anio){

    /*
        Guardia frontend Fase 5:
        bloquea la exportación mensual directa si alguien intenta ejecutar
        exportarGanttPorMes(mes, anio) desde consola.
    */
    if (
        typeof usuarioPuedeAccionIronix === "function" &&
        !usuarioPuedeAccionIronix("documentacion", "exportar")
    ) {
        alert("No tienes permisos para exportar documentación");
        return;
    }

    try {

        if (typeof cerrarPanelAccionesGantt === "function") {
            cerrarPanelAccionesGantt();
        }

        const respuesta = await fetch("php/produccion/obtener_produccion.php");
        const data = await respuesta.json();

        if (!data.success || !Array.isArray(data.data)) {
            alert("No se pudieron obtener los datos de producción");
            return;
        }

        const inicioMes = new Date(anio, mes, 1, 0, 0, 0, 0);
        const finMes = new Date(anio, mes + 1, 0, 23, 59, 59, 999);

        const MS_DIA = 1000 * 60 * 60 * 24;
        const anchoDia = 48;
        const totalDias = new Date(anio, mes + 1, 0).getDate();

        const registros = data.data.flatMap(item => {

            let inicio = fechaParaGantt(item.fecha);
            let fin = fechaParaGantt(item.fecha_fin);

            if (!inicio) {
                return [];
            }

            if (!fin) {
                let dias = parseInt(item.dias);

                if (isNaN(dias) || dias <= 0) {
                    dias = 1;
                }

                fin = sumarDias(inicio, dias);
            }

            const fechaInicio = fechaLocal(inicio);
            const fechaFin = fechaLocal(fin);

            if (!fechaInicio || !fechaFin) {
                return [];
            }

            fechaInicio.setHours(0, 0, 0, 0);
            fechaFin.setHours(23, 59, 59, 999);

            const cruzaMes =
                fechaFin >= inicioMes &&
                fechaInicio <= finMes;

            if (!cruzaMes) {
                return [];
            }

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

            const cortadaIzquierda = fechaInicio < inicioMes;
            const cortadaDerecha = fechaFin > finMes;

            const inicioVisible = new Date(Math.max(fechaInicio, inicioMes));
            const finVisible = new Date(Math.min(fechaFin, finMes));

            const claseEstado = obtenerClaseEstado(0, item, fin);

            return maquinas.map(maquina => {
                return {
                    id: item.id,
                    producto: item.producto || "Sin nombre",
                    pedido: item.numero_pedido || "-",
                    maquina,
                    operador: item.usuario || "Admin",
                    inicioVisible,
                    finVisible,
                    claseEstado,

                    trabajaSabado: normalizarTrabajaSabadoExportacionGantt(
                        item.trabaja_sabado ?? item.trabajaSabado
                    ),
                    trabajaSabadoRaw: item.trabaja_sabado ?? item.trabajaSabado,
                    inicioOriginal: inicio,
                    finOriginal: fin,

                    cortadaIzquierda,
                    cortadaDerecha
                };
            });
        });

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

        const maquinas = Object.values(agrupado).sort((a, b) => {
            return a.maquina.localeCompare(b.maquina);
        });

        const anchoMesGantt = totalDias * anchoDia;

        const hayCorteIzquierda = registros.some(item => item.cortadaIzquierda);
        const hayCorteDerecha = registros.some(item => item.cortadaDerecha);

        const nombresCorteIzquierda = registros
            .filter(item => item.cortadaIzquierda)
            .map(item => item.producto);

        const nombresCorteDerecha = registros
            .filter(item => item.cortadaDerecha)
            .map(item => item.producto);

        const margenIzquierdaExportacion = hayCorteIzquierda
            ? calcularMargenCorteExportacionGantt(nombresCorteIzquierda)
            : 0;

        const margenDerechaExportacion = hayCorteDerecha
            ? calcularMargenCorteExportacionGantt(nombresCorteDerecha)
            : 0;

        const anchoGanttExportacion =
            margenIzquierdaExportacion +
            anchoMesGantt +
            margenDerechaExportacion;

        let diasHtml = "";

        const nombresDiasExportacion = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        for (let dia = 1; dia <= totalDias; dia++) {

            const fechaDia = new Date(anio, mes, dia);
            const numeroDiaSemana = fechaDia.getDay();
            const nombreDiaSemana = nombresDiasExportacion[numeroDiaSemana];

            const claseFinDeSemana =
                numeroDiaSemana === 0 || numeroDiaSemana === 6
                    ? "gantt-weekend"
                    : "";

            diasHtml += `
                <div 
                    class="gantt-day ${claseFinDeSemana}"
                    style="
                        width:${anchoDia}px;
                        min-width:${anchoDia}px;
                    ">
                    <span class="gantt-day-number">${String(dia).padStart(2, "0")}</span>
                    <span class="gantt-day-name">${nombreDiaSemana}</span>
                </div>
            `;
        }

        let sidebarHtml = `
            <div class="gantt-side-head machine-mode">
                <strong>Máquina</strong>
                <strong>Operador</strong>
            </div>
        `;

        let lineasGridMesHtml = "";
        let finesSemanaMesHtml = "";

        for (let dia = 1; dia <= totalDias; dia++) {

            const fechaDia = new Date(anio, mes, dia);
            const esFinSemana = fechaDia.getDay() === 0 || fechaDia.getDay() === 6;

            if (esFinSemana) {
                finesSemanaMesHtml += `
                    <div
                        class="gantt-weekend-column"
                        style="
                            position:absolute;
                            top:0;
                            bottom:0;
                            left:${margenIzquierdaExportacion + ((dia - 1) * anchoDia)}px;
                            width:${anchoDia}px;
                            height:100%;
                            background:#ffcdd2;
                            background-color:#ffcdd2;
                            z-index:1;
                            pointer-events:none;
                        "
                    ></div>
                `;
            }
        }

        const sabadosHabilitadosMesHtml = generarSabadosHabilitadosMesExportacionGantt(
            registros,
            anio,
            mes,
            totalDias,
            anchoDia,
            margenIzquierdaExportacion
        );

        for (let dia = 0; dia <= totalDias; dia++) {
            lineasGridMesHtml += `
                <div 
                    class="gantt-export-linea-dia"
                    style="
                        position:absolute;
                        left:${margenIzquierdaExportacion + (dia * anchoDia)}px;
                        top:0;
                        width:1px;
                        height:100%;
                        background:#d1d5db;
                        z-index:6;
                        pointer-events:none;
                    ">
                </div>
            `;
        }

        let filasHtml = "";

        if (!maquinas.length) {

            sidebarHtml += `
                <div class="gantt-side-row machine-mode">
                    <div class="gantt-side-producto">
                        <span class="gantt-color-dot machine-dot"></span>

                        <div class="gantt-machine-name-block">
                            <strong class="gantt-machine-name-text">Sin registros</strong>
                            <small class="gantt-machine-count-text">(0 productos)</small>
                        </div>
                    </div>

                    <div>-</div>
                </div>
            `;

            filasHtml += `
                <div 
                    class="gantt-machine-timeline-row"
                    style="
                        width:${anchoGanttExportacion}px;
                        min-width:${anchoGanttExportacion}px;
                        position:relative;
                        overflow:visible;
                        background:#ffffff;
                    ">

                    <div 
                        class="gantt-weekend-row-overlay"
                        style="
                            position:absolute;
                            inset:0;
                            z-index:1;
                            pointer-events:none;
                            overflow:visible;
                        ">
                        ${finesSemanaMesHtml}
                        ${sabadosHabilitadosMesHtml}
                    </div>
                    
                    ${lineasGridMesHtml}
                </div>
            `;

        } else {

            maquinas.forEach(grupo => {

                const totalProductos = grupo.tareas.length;
                const textoProductos = totalProductos === 1 ? "producto" : "productos";

                sidebarHtml += `
                    <div class="gantt-side-row machine-mode">
                        <div 
                            class="gantt-side-producto"
                            style="
                                display:flex;
                                align-items:center;
                                gap:18px;
                                min-width:0;
                            "
                        >
                            <span class="gantt-color-dot machine-dot"></span>

                            <div 
                                class="gantt-machine-name-block"
                                style="
                                    display:flex !important;
                                    flex-direction:column !important;
                                    align-items:flex-start !important;
                                    justify-content:center;
                                    gap:5px;
                                    min-width:0;
                                    line-height:1.15;
                                    text-align:left;
                                "
                            >
                                <strong 
                                    class="gantt-machine-name-text"
                                    style="
                                        display:block !important;
                                        margin:0;
                                        padding:0;
                                        width:100%;
                                        font-size:16px;
                                        font-weight:800;
                                        line-height:1.15;
                                        color:#111827;
                                        white-space:nowrap;
                                        text-align:left;
                                    "
                                >${escaparTextoGantt(grupo.maquina)}</strong>

                                <span 
                                    class="gantt-machine-count-text"
                                    style="
                                        display:block !important;
                                        margin:0;
                                        padding:0;
                                        width:100%;
                                        font-size:13px;
                                        font-weight:500;
                                        line-height:1.1;
                                        color:#6b7280;
                                        white-space:nowrap;
                                        text-align:left;
                                    "
                                >(${totalProductos} ${textoProductos})</span>
                            </div>
                        </div>

                        <div>${escaparTextoGantt(grupo.operador)}</div>
                    </div>
                `;

                let barrasHtml = "";

                grupo.tareas.forEach(tarea => {

                    const offsetDias = Math.floor((tarea.inicioVisible - inicioMes) / MS_DIA);

                    const duracionDias = Math.max(
                        1,
                        Math.floor((tarea.finVisible - tarea.inicioVisible) / MS_DIA) + 1
                    );

                    const estaCortada = tarea.cortadaIzquierda || tarea.cortadaDerecha;

                    const textoDentroBarra = estaCortada
                        ? ""
                        : escaparTextoGantt(tarea.producto);

                    let etiquetasCorteHtml = "";

                    if (tarea.cortadaDerecha && margenDerechaExportacion > 0) {
                        etiquetasCorteHtml += `
                            <div 
                                class="gantt-etiqueta-corte derecha"
                                style="
                                    left:${margenIzquierdaExportacion + anchoMesGantt + 32}px;
                                    width:${Math.max(120, margenDerechaExportacion - 44)}px;
                                ">
                                <span>→</span>
                                <strong>${escaparTextoGantt(tarea.producto)}</strong>
                            </div>
                        `;
                    }

                    if (tarea.cortadaIzquierda && margenIzquierdaExportacion > 0) {
                        etiquetasCorteHtml += `
                            <div 
                                class="gantt-etiqueta-corte izquierda"
                                style="
                                    left:12px;
                                    width:${Math.max(120, margenIzquierdaExportacion - 32)}px;
                                ">
                                <strong>${escaparTextoGantt(tarea.producto)}</strong>
                                <span>←</span>
                            </div>
                        `;
                    }

                    barrasHtml += `
                        <div
                            class="gantt-machine-bar ${tarea.claseEstado}"
                            style="
                                left:${margenIzquierdaExportacion + (offsetDias * anchoDia)}px;
                                width:${duracionDias * anchoDia}px;
                                z-index:10;
                            "
                        >
                            <span class="gantt-bar-texto">${textoDentroBarra}</span>
                        </div>

                        ${etiquetasCorteHtml}
                    `;
                });

                filasHtml += `
                    <div 
                        class="gantt-machine-timeline-row"
                        style="
                            width:${anchoGanttExportacion}px;
                            min-width:${anchoGanttExportacion}px;
                            position:relative;
                            overflow:visible;
                            background:#ffffff;
                        ">

                        <div 
                            class="gantt-weekend-row-overlay"
                            style="
                                position:absolute;
                                inset:0;
                                z-index:1;
                                pointer-events:none;
                                overflow:visible;
                            ">
                            ${finesSemanaMesHtml}
                            ${sabadosHabilitadosMesHtml}
                        </div>
                        
                        ${lineasGridMesHtml}

                        ${barrasHtml}
                    </div>
                `;
            });
        }

        const anchoGantt = anchoGanttExportacion;
        const anchoSidebar = 400;

        const exportWrapper = document.createElement("div");

        exportWrapper.style.position = "fixed";
        exportWrapper.style.left = "-99999px";
        exportWrapper.style.top = "0";
        exportWrapper.style.background = "#2f3040";
        exportWrapper.style.padding = "24px";
        exportWrapper.style.zIndex = "-1";
        exportWrapper.style.width = `${anchoSidebar + anchoGantt + 80}px`;

        exportWrapper.innerHTML = `
            <div class="doc-viewer-card gantt-panel gantt-export-monthly">

                <div class="gantt-header">
                    <h3>📅 Carta Gantt de Producción - ${nombreMesGantt(mes)} ${anio}</h3>
                </div>

                <div class="gantt-leyenda">
                    <span><b class="estado-verde"></b> En Proceso</span>
                    <span><b class="estado-azul"></b> Pendiente</span>
                    <span><b class="estado-rojo"></b> Retraso</span>
                    <span><b class="estado-naranja"></b> Tiempo Muerto</span>
                    <span><b class="estado-gris"></b> Terminado</span>
                </div>

                <div class="gantt-wrapper" style="width:${anchoSidebar + anchoGantt}px; overflow:visible;">
                    <div id="gantt-sidebar" style="overflow:visible;">
                        ${sidebarHtml}
                    </div>

                    <div id="gantt" style="width:${anchoGantt}px; height:auto; overflow:visible;">
                        <div class="gantt-machine-pro" style="width:${anchoGantt}px;">
                            <div class="gantt-machine-calendar" style="width:${anchoGantt}px;">
                                <div class="gantt-months" style="width:${anchoGantt}px;">
                                    <div 
                                        class="gantt-month" 
                                        style="
                                            left:${margenIzquierdaExportacion}px;
                                            width:${anchoMesGantt}px;
                                        ">
                                        ${nombreMesGantt(mes)} ${anio}
                                    </div>
                                </div>

                                <div 
                                    class="gantt-days"
                                    style="
                                        margin-left:${margenIzquierdaExportacion}px;
                                        width:${anchoMesGantt}px;
                                    ">
                                    ${diasHtml}
                                </div>
                            </div>

                            <div class="gantt-machine-body" style="width:${anchoGantt}px;">
                                ${filasHtml}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;

        document.body.appendChild(exportWrapper);

        const panelExportar = exportWrapper.querySelector(".gantt-export-monthly");

        const canvas = await html2canvas(panelExportar, {
            scale: 2,
            backgroundColor: "#2f3040",
            useCORS: true,
            logging: false,
            width: panelExportar.scrollWidth,
            height: panelExportar.scrollHeight,
            windowWidth: panelExportar.scrollWidth,
            windowHeight: panelExportar.scrollHeight
        });

        const imagen = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = imagen;
        link.download = `Carta_Gantt_${nombreMesGantt(mes)}_${anio}.png`;
        link.click();

        document.body.removeChild(exportWrapper);

    } catch (error) {
        console.error("Error exportando Gantt por mes:", error);
        alert("No se pudo exportar la Carta Gantt mensual");
    }
}

/* =========================
   CAPTURAR IMAGEN GANTT PARA PDF
   No descarga la imagen, solo retorna base64
========================= */
async function capturarGanttImagenParaPDF() {

    /*
        Guardia frontend Fase 5:
        bloquea la captura directa del Gantt para PDF si alguien intenta
        ejecutar capturarGanttImagenParaPDF() desde consola.
    */
    if (
        typeof usuarioPuedeAccionIronix === "function" &&
        !usuarioPuedeAccionIronix("documentacion", "exportar")
    ) {
        console.warn("No tienes permisos para capturar/exportar documentación");
        return null;
    }

    const panelOriginal = document.querySelector(".gantt-panel");
    const ganttOriginal = document.getElementById("gantt");

    if (!panelOriginal || !ganttOriginal || ganttOriginal.innerHTML.trim() === "") {
        console.warn("No hay Carta Gantt disponible para insertar en el PDF");
        return null;
    }

    try {

        if (typeof html2canvas === "undefined") {
            console.warn("No se encontró html2canvas");
            return null;
        }

        /* Cerrar panel flotante si está abierto */
        if (typeof cerrarPanelAccionesGantt === "function") {
            cerrarPanelAccionesGantt();
        }

        await new Promise(resolve => setTimeout(resolve, 150));

        /* Clonar panel completo */
        const clon = panelOriginal.cloneNode(true);

        clon.classList.add("gantt-export-clone");

        /* Quitar controles que no aportan al reporte */
        const controles = clon.querySelector(".gantt-controls");
        if (controles) {
            controles.remove();
        }

        /* Quitar panel flotante si quedó dentro del clon */
        const panelAcciones = clon.querySelector("#panelAccionesGantt");
        if (panelAcciones) {
            panelAcciones.remove();
        }

        /* Preparar estructura clonada */
        const ganttClonado = clon.querySelector("#gantt");
        const sidebarClonado = clon.querySelector("#gantt-sidebar");
        const wrapperClonado = clon.querySelector(".gantt-wrapper");
        const ganttProClonado = clon.querySelector(".gantt-machine-pro");

        const anchoGantt = ganttOriginal.scrollWidth;
        const altoGantt = ganttOriginal.scrollHeight;
        const anchoSidebar = document.getElementById("gantt-sidebar")?.offsetWidth || 400;

        if (wrapperClonado) {
            wrapperClonado.style.width = `${anchoSidebar + anchoGantt}px`;
            wrapperClonado.style.maxWidth = "none";
            wrapperClonado.style.overflow = "visible";
        }

        if (sidebarClonado) {
            sidebarClonado.style.overflow = "visible";
        }

        if (ganttClonado) {
            ganttClonado.style.width = `${anchoGantt}px`;
            ganttClonado.style.height = `${altoGantt}px`;
            ganttClonado.style.overflow = "visible";
        }

        if (ganttProClonado) {
            ganttProClonado.style.width = `${anchoGantt}px`;
        }

        /* Contenedor temporal fuera de pantalla */
        const exportWrapper = document.createElement("div");

        exportWrapper.style.position = "fixed";
        exportWrapper.style.left = "-99999px";
        exportWrapper.style.top = "0";
        exportWrapper.style.background = "#2f3040";
        exportWrapper.style.padding = "24px";
        exportWrapper.style.zIndex = "-1";
        exportWrapper.style.width = `${anchoSidebar + anchoGantt + 80}px`;

        exportWrapper.appendChild(clon);
        document.body.appendChild(exportWrapper);

        const canvas = await html2canvas(clon, {
            scale: 2,
            backgroundColor: "#2f3040",
            useCORS: true,
            logging: false,
            width: clon.scrollWidth,
            height: clon.scrollHeight,
            windowWidth: clon.scrollWidth,
            windowHeight: clon.scrollHeight
        });

        const imagen = canvas.toDataURL("image/png");

        document.body.removeChild(exportWrapper);

        return imagen;

    } catch (error) {

        console.error("Error capturando Gantt para PDF:", error);

        return null;
    }
}

window.exportarGanttPorMes = exportarGanttPorMes;
window.descargarGanttImagen = descargarGanttImagen;
window.capturarGanttImagenParaPDF = capturarGanttImagenParaPDF;