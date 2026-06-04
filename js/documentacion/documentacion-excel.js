/* =========================
   DESCARGAR EXCEL CARTA GANTT PRO
========================= */
async function descargarGanttExcel(){

    try {

        if (typeof ExcelJS === "undefined") {
            alert("No se encontró la librería ExcelJS");
            return;
        }

        const response = await fetch("php/produccion/obtener_produccion.php", {
            cache: "no-store"
        });

        const data = await response.json();

        if (!data.success || !data.data || !data.data.length) {
            alert("No hay datos para exportar a Excel");
            return;
        }

        /* =========================
           HELPERS INTERNOS EXCEL
        ========================= */

        function normalizarSabadoTrabajadoExcel(valor) {

            if (valor === true || valor === 1) return true;

            const texto = String(valor ?? "")
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            return (
                texto === "1" ||
                texto === "true" ||
                texto === "si" ||
                texto === "s" ||
                texto === "yes"
            );
        }

        function diasEntreFechasExcel(inicioTexto, finTexto) {

            const inicio = fechaLocal(inicioTexto);
            const fin = fechaLocal(finTexto);

            if (!inicio || !fin) return 1;

            inicio.setHours(0, 0, 0, 0);
            fin.setHours(0, 0, 0, 0);

            const MS_DIA = 1000 * 60 * 60 * 24;
            const diferencia = Math.floor((fin - inicio) / MS_DIA) + 1;

            return Math.max(1, diferencia);
        }

        function sumarDiasFechaExcel(fechaTexto, dias) {

            const fecha = fechaLocal(fechaTexto);

            if (!fecha) return null;

            fecha.setDate(fecha.getDate() + dias);

            return fechaParaGantt(fecha);
        }

        function hayChoqueFechasExcel(inicioA, finA, inicioB, finB) {

            const aInicio = fechaLocal(inicioA);
            const aFin = fechaLocal(finA);
            const bInicio = fechaLocal(inicioB);
            const bFin = fechaLocal(finB);

            if (!aInicio || !aFin || !bInicio || !bFin) return false;

            aInicio.setHours(0, 0, 0, 0);
            aFin.setHours(0, 0, 0, 0);
            bInicio.setHours(0, 0, 0, 0);
            bFin.setHours(0, 0, 0, 0);

            return aInicio <= bFin && bInicio <= aFin;
        }

        function obtenerClaveMaquinaExcel(tarea) {

            if (typeof obtenerClaveMaquinaGantt === "function") {
                return obtenerClaveMaquinaGantt(tarea);
            }

            if (tarea.idMaquina && Number(tarea.idMaquina) > 0) {
                return `id-${Number(tarea.idMaquina)}`;
            }

            const zona = String(tarea.zona || "")
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            const maquina = String(tarea.maquina || "Sin máquina")
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            return `${zona}||${maquina}`;
        }

        function aplicarColaPorMaquinaExcel(registrosExcel) {

            const grupos = {};

            registrosExcel.forEach(tarea => {

                const clave = obtenerClaveMaquinaExcel(tarea);

                if (!grupos[clave]) {
                    grupos[clave] = [];
                }

                grupos[clave].push(tarea);
            });

            Object.values(grupos).forEach(tareasMaquina => {

                tareasMaquina.sort((a, b) => {

                    const diferenciaIdPm =
                        Number(a.idProduccionMaquina || 0) -
                        Number(b.idProduccionMaquina || 0);

                    if (diferenciaIdPm !== 0) return diferenciaIdPm;

                    const diferenciaFecha =
                        fechaLocal(a.inicio) - fechaLocal(b.inicio);

                    if (diferenciaFecha !== 0) return diferenciaFecha;

                    const diferenciaOrden =
                        Number(a.ordenProceso || 999) -
                        Number(b.ordenProceso || 999);

                    if (diferenciaOrden !== 0) return diferenciaOrden;

                    return Number(a.id || 0) - Number(b.id || 0);
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
                        Number(tarea.duracionOriginalDias) ||
                        diasEntreFechasExcel(tarea.inicio, tarea.fin)
                    );

                    let inicioPropuesto = tarea.inicio;
                    let finPropuesto = tarea.fin;
                    let fueReprogramada = false;
                    let ultimoConflicto = null;

                    while (true) {

                        const conflicto = tareasProgramadas.find(programada => {
                            return hayChoqueFechasExcel(
                                inicioPropuesto,
                                finPropuesto,
                                programada.inicio,
                                programada.fin
                            );
                        });

                        if (!conflicto) break;

                        ultimoConflicto = conflicto;

                        const conflictoFin = fechaLocal(conflicto.fin);

                        if (!conflictoFin) break;

                        conflictoFin.setDate(conflictoFin.getDate() + 1);

                        inicioPropuesto = fechaParaGantt(conflictoFin);
                        finPropuesto = sumarDiasFechaExcel(
                            inicioPropuesto,
                            duracionDias - 1
                        );

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

            return registrosExcel;
        }

        function fechaDentroRangoExcel(fecha, inicioTexto, finTexto) {

            const fechaBase = new Date(fecha);
            const inicio = fechaLocal(inicioTexto);
            const fin = fechaLocal(finTexto);

            if (!inicio || !fin) return false;

            fechaBase.setHours(0, 0, 0, 0);
            inicio.setHours(0, 0, 0, 0);
            fin.setHours(0, 0, 0, 0);

            return fechaBase >= inicio && fechaBase <= fin;
        }

        /* =========================
           CONSTRUIR REGISTROS BASE
        ========================= */

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

            const maquinasDetalle = typeof parsearMaquinasDetalleGantt === "function"
                ? parsearMaquinasDetalleGantt(item)
                : [{
                    idProduccionMaquina: 0,
                    idMaquina: 0,
                    maquina: item.maquina || "Sin máquina",
                    zona: "",
                    ordenProceso: 1,
                    horas: 0,
                    minutos: 0
                }];

            return maquinasDetalle.map(detalle => {

                const duracionOriginalDias = diasEntreFechasExcel(inicio, fin);

                return {
                    id: Number(item.id || 0),
                    producto: item.producto || "Sin nombre",
                    pedido: item.numero_pedido || "-",

                    maquina: detalle.maquina || "Sin máquina",
                    operador: item.usuario || "Admin",

                    inicio,
                    fin,
                    inicioOriginal: inicio,
                    finOriginal: fin,
                    duracionOriginalDias,

                    estado: claseEstado.replace("gantt-", ""),

                    idProduccionMaquina: Number(detalle.idProduccionMaquina || 0),
                    idMaquina: Number(detalle.idMaquina || 0),
                    zona: detalle.zona || "",
                    ordenProceso: Number(detalle.ordenProceso || 1),
                    horasMaquina: Number(detalle.horas || 0),
                    minutosMaquina: Number(detalle.minutos || 0),

                    trabajaSabadoRaw: item.trabaja_sabado ?? item.trabajaSabado ?? false,
                    trabajaSabado: normalizarSabadoTrabajadoExcel(
                        item.trabaja_sabado ?? item.trabajaSabado ?? false
                    )
                };
            });
        });

        if (!registros.length) {
            alert("No hay registros válidos para exportar");
            return;
        }

        /*
            Punto clave del arreglo:
            El Excel debe usar la misma cola por máquina que la Carta Gantt web.
            Esto evita que una pieza tape a otra cuando comparten máquina y fechas.
        */
        if (typeof aplicarColaPorMaquinaGantt === "function") {
            aplicarColaPorMaquinaGantt(registros);
        } else {
            aplicarColaPorMaquinaExcel(registros);
        }

        /* =========================
           RANGO DE FECHAS
        ========================= */

        const fechas = registros
            .flatMap(r => [fechaLocal(r.inicio), fechaLocal(r.fin)])
            .filter(Boolean);

        if (!fechas.length) {
            alert("No hay fechas válidas para generar el Excel");
            return;
        }

        const minFecha = new Date(Math.min(...fechas));
        const maxFecha = new Date(Math.max(...fechas));

        minFecha.setHours(0, 0, 0, 0);
        maxFecha.setHours(0, 0, 0, 0);

        minFecha.setDate(minFecha.getDate() - 2);
        maxFecha.setDate(maxFecha.getDate() + 2);

        const MS_DIA = 1000 * 60 * 60 * 24;
        const totalDias = Math.floor((maxFecha - minFecha) / MS_DIA);

        const dias = [];
        const diasSemanaExcel = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        for (let i = 0; i <= totalDias; i++) {

            const fecha = new Date(minFecha);

            fecha.setDate(minFecha.getDate() + i);
            fecha.setHours(0, 0, 0, 0);

            const nombreMes = fecha.toLocaleDateString("es-CL", {
                month: "long"
            });

            dias.push({
                fecha,
                texto: fecha.toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "numeric"
                }),
                diaTexto: String(fecha.getDate()).padStart(2, "0"),
                diaSemanaTexto: diasSemanaExcel[fecha.getDay()],
                mesTexto: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
                mesClave: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`
            });
        }

        /* =========================
           AGRUPAR POR MÁQUINA
        ========================= */

        const agrupado = {};

        registros.forEach(item => {

            const claveMaquina = obtenerClaveMaquinaExcel(item);

            if (!agrupado[claveMaquina]) {

                agrupado[claveMaquina] = {
                    clave: claveMaquina,
                    maquina: item.maquina,
                    operador: item.operador,
                    zona: item.zona || "",
                    idMaquina: item.idMaquina || 0,
                    tareas: []
                };
            }

            if (
                (!agrupado[claveMaquina].operador ||
                agrupado[claveMaquina].operador === "Admin") &&
                item.operador
            ) {
                agrupado[claveMaquina].operador = item.operador;
            }

            agrupado[claveMaquina].tareas.push(item);
        });

        Object.values(agrupado).forEach(grupo => {

            grupo.tareas.sort((a, b) => {

                const diferenciaFecha =
                    fechaLocal(a.inicio) - fechaLocal(b.inicio);

                if (diferenciaFecha !== 0) return diferenciaFecha;

                const diferenciaOrden =
                    Number(a.ordenProceso || 999) -
                    Number(b.ordenProceso || 999);

                if (diferenciaOrden !== 0) return diferenciaOrden;

                const diferenciaIdPm =
                    Number(a.idProduccionMaquina || 0) -
                    Number(b.idProduccionMaquina || 0);

                if (diferenciaIdPm !== 0) return diferenciaIdPm;

                return Number(a.id || 0) - Number(b.id || 0);
            });
        });

        const ordenMaquinas = Object.values(agrupado).sort((a, b) => {
            return a.maquina.localeCompare(b.maquina, "es", {
                numeric: true,
                sensitivity: "base"
            });
        });

        /* =========================
           CREAR WORKBOOK
        ========================= */

        const workbook = new ExcelJS.Workbook();

        workbook.creator = "IRONIX";
        workbook.created = new Date();
        workbook.modified = new Date();

        const ganttSheet = workbook.addWorksheet("Carta Gantt");

        ganttSheet.views = [{
            showGridLines: true,
            state: "frozen",
            xSplit: 2,
            ySplit: 4
        }];

        const totalColumnas = dias.length + 2;

        /* =========================
           TÍTULO
        ========================= */

        ganttSheet.mergeCells(1, 1, 1, totalColumnas);

        const titulo = ganttSheet.getCell("A1");

        titulo.value = "CARTA GANTT DE PRODUCCIÓN - LAGMET";

        titulo.font = {
            bold: true,
            size: 16,
            color: { argb: "FFFFFFFF" }
        };

        titulo.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF59E0B" }
        };

        titulo.alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        titulo.border = borderExcelFuerte();

        ganttSheet.getRow(1).height = 26;
        ganttSheet.getRow(2).height = 22;
        ganttSheet.getRow(3).height = 20;
        ganttSheet.getRow(4).height = 18;

        /* =========================
           ESTILOS ENCABEZADOS
        ========================= */

        function aplicarEstiloHeaderGanttExcel(cell, fondo = "FFB7DEE8") {

            cell.font = {
                bold: true,
                color: { argb: "FF0F172A" }
            };

            cell.alignment = {
                horizontal: "center",
                vertical: "middle"
            };

            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: fondo }
            };

            cell.border = borderExcelFuerte();
        }

        function esFinDeSemanaExcel(fecha) {

            const fechaExcel = new Date(fecha);
            const diaSemana = fechaExcel.getDay();

            return diaSemana === 0 || diaSemana === 6;
        }

        function esSabadoTrabajadoExcel(fecha) {

            const fechaExcel = new Date(fecha);

            if (fechaExcel.getDay() !== 6) {
                return false;
            }

            fechaExcel.setHours(0, 0, 0, 0);

            return registros.some(tarea => {

                if (tarea.trabajaSabado !== true) return false;

                return fechaDentroRangoExcel(
                    fechaExcel,
                    tarea.inicio,
                    tarea.fin
                );
            });
        }

        function colorHeaderDiaExcel(fecha) {

            if (esSabadoTrabajadoExcel(fecha)) {
                return "FFC6E0B4";
            }

            if (esFinDeSemanaExcel(fecha)) {
                return "FFFFCDD2";
            }

            return "FFB7DEE8";
        }

        function fondoDiaBaseExcel(fecha) {

            if (esSabadoTrabajadoExcel(fecha)) {
                return {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFE2F0D9" }
                };
            }

            if (esFinDeSemanaExcel(fecha)) {
                return {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFCDD2" }
                };
            }

            return {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFFFFF" }
            };
        }

        /* =========================
           ENCABEZADO LATERAL
        ========================= */

        ganttSheet.mergeCells(2, 1, 4, 1);
        ganttSheet.mergeCells(2, 2, 4, 2);

        const headerMaquina = ganttSheet.getCell(2, 1);
        const headerOperador = ganttSheet.getCell(2, 2);

        headerMaquina.value = "Máquina";
        headerOperador.value = "Operador";

        aplicarEstiloHeaderGanttExcel(headerMaquina, "FF9FD5E5");
        aplicarEstiloHeaderGanttExcel(headerOperador, "FF9FD5E5");

        for (let fila = 2; fila <= 4; fila++) {
            aplicarEstiloHeaderGanttExcel(ganttSheet.getCell(fila, 1), "FF9FD5E5");
            aplicarEstiloHeaderGanttExcel(ganttSheet.getCell(fila, 2), "FF9FD5E5");
        }

        /* =========================
           ENCABEZADO MESES
        ========================= */

        let inicioGrupoMes = 0;

        while (inicioGrupoMes < dias.length) {

            const mesActual = dias[inicioGrupoMes].mesClave;
            const nombreMesActual = dias[inicioGrupoMes].mesTexto;

            let finGrupoMes = inicioGrupoMes;

            while (
                finGrupoMes + 1 < dias.length &&
                dias[finGrupoMes + 1].mesClave === mesActual
            ) {
                finGrupoMes++;
            }

            const colInicioMes = inicioGrupoMes + 3;
            const colFinMes = finGrupoMes + 3;

            if (colInicioMes < colFinMes) {
                ganttSheet.mergeCells(2, colInicioMes, 2, colFinMes);
            }

            const celdaMes = ganttSheet.getCell(2, colInicioMes);

            celdaMes.value = nombreMesActual;

            aplicarEstiloHeaderGanttExcel(celdaMes, "FF9FD5E5");

            for (let col = colInicioMes; col <= colFinMes; col++) {
                aplicarEstiloHeaderGanttExcel(
                    ganttSheet.getCell(2, col),
                    "FF9FD5E5"
                );
            }

            inicioGrupoMes = finGrupoMes + 1;
        }

        /* =========================
           ENCABEZADO DÍAS
        ========================= */

        dias.forEach((dia, index) => {

            const col = index + 3;
            const celdaDia = ganttSheet.getCell(3, col);

            celdaDia.value = dia.fecha.getDate();
            celdaDia.numFmt = "00";

            aplicarEstiloHeaderGanttExcel(
                celdaDia,
                colorHeaderDiaExcel(dia.fecha)
            );
        });

        dias.forEach((dia, index) => {

            const col = index + 3;
            const celdaSemana = ganttSheet.getCell(4, col);

            celdaSemana.value = dia.diaSemanaTexto;

            aplicarEstiloHeaderGanttExcel(
                celdaSemana,
                colorHeaderDiaExcel(dia.fecha)
            );

            if (esSabadoTrabajadoExcel(dia.fecha)) {
                celdaSemana.font = {
                    bold: true,
                    color: { argb: "FF166534" }
                };
            } else if (esFinDeSemanaExcel(dia.fecha)) {
                celdaSemana.font = {
                    bold: true,
                    color: { argb: "FFB91C1C" }
                };
            }
        });

        /* =========================
        ORGANIZAR TAREAS EN SUBFILAS EXCEL
        Evita que productos se tapen entre sí
        ========================= */

        function organizarTareasEnSubfilasExcel(tareas){

            const subfilas = [];

            const tareasOrdenadas = [...tareas].sort((a, b) => {

                const diferenciaFecha =
                    fechaLocal(a.inicio) - fechaLocal(b.inicio);

                if (diferenciaFecha !== 0) return diferenciaFecha;

                const diferenciaOrden =
                    Number(a.ordenProceso || 999) -
                    Number(b.ordenProceso || 999);

                if (diferenciaOrden !== 0) return diferenciaOrden;

                const diferenciaIdPm =
                    Number(a.idProduccionMaquina || 0) -
                    Number(b.idProduccionMaquina || 0);

                if (diferenciaIdPm !== 0) return diferenciaIdPm;

                return Number(a.id || 0) - Number(b.id || 0);
            });

            tareasOrdenadas.forEach(tarea => {

                let insertada = false;

                for (const subfila of subfilas) {

                    const tieneChoque = subfila.some(tareaExistente => {
                        return hayChoqueFechasExcel(
                            tarea.inicio,
                            tarea.fin,
                            tareaExistente.inicio,
                            tareaExistente.fin
                        );
                    });

                    if (!tieneChoque) {
                        subfila.push(tarea);
                        insertada = true;
                        break;
                    }
                }

                if (!insertada) {
                    subfilas.push([tarea]);
                }
            });

            return subfilas;
        }

            /* =========================
            FILAS POR MÁQUINA
            Con subfilas internas para evitar solapamientos
            ========================= */

            let filaActual = 5;

            ordenMaquinas.forEach(grupo => {

                const subfilas = organizarTareasEnSubfilasExcel(grupo.tareas);

                const totalProductos = grupo.tareas.length;
                const textoProductos = totalProductos === 1 ? "producto" : "productos";

                const filaInicioGrupo = filaActual;
                const cantidadSubfilas = Math.max(1, subfilas.length);
                const filaFinGrupo = filaInicioGrupo + cantidadSubfilas - 1;

                /* =========================
                CREAR FILAS BASE DEL GRUPO
                ========================= */

                for (let i = 0; i < cantidadSubfilas; i++) {

                    const fila = ganttSheet.getRow(filaActual);

                    fila.height = 30;

                    const celdaMaquina = fila.getCell(1);
                    const celdaOperador = fila.getCell(2);

                    [celdaMaquina, celdaOperador].forEach(cell => {

                        cell.alignment = {
                            horizontal: "center",
                            vertical: "middle",
                            wrapText: true
                        };

                        cell.border = borderExcelFuerte();
                        cell.fill = fondoFilaExcel();
                    });

                    dias.forEach((dia, index) => {

                        const cell = fila.getCell(index + 3);

                        cell.border = borderExcelSuave();
                        cell.fill = fondoDiaBaseExcel(dia.fecha);

                        cell.alignment = {
                            horizontal: "center",
                            vertical: "middle"
                        };
                    });

                    filaActual++;
                }

                /* =========================
                AGRUPAR VISUALMENTE MÁQUINA / OPERADOR
                ========================= */

                if (filaInicioGrupo < filaFinGrupo) {
                    ganttSheet.mergeCells(filaInicioGrupo, 1, filaFinGrupo, 1);
                    ganttSheet.mergeCells(filaInicioGrupo, 2, filaFinGrupo, 2);
                }

                const celdaMaquinaGrupo = ganttSheet.getCell(filaInicioGrupo, 1);
                const celdaOperadorGrupo = ganttSheet.getCell(filaInicioGrupo, 2);

                celdaMaquinaGrupo.value = `${grupo.maquina}\n(${totalProductos} ${textoProductos})`;
                celdaOperadorGrupo.value = grupo.operador || "Admin";

                celdaMaquinaGrupo.font = {
                    bold: true,
                    color: { argb: "FF000000" }
                };

                celdaOperadorGrupo.font = {
                    bold: false,
                    color: { argb: "FF000000" }
                };

                [celdaMaquinaGrupo, celdaOperadorGrupo].forEach(cell => {

                    cell.alignment = {
                        horizontal: "center",
                        vertical: "middle",
                        wrapText: true
                    };

                    cell.border = borderExcelFuerte();
                    cell.fill = fondoFilaExcel();
                });

                /* =========================
                PINTAR BARRAS POR SUBFILA
                ========================= */

                subfilas.forEach((tareasSubfila, indexSubfila) => {

                    const numeroFila = filaInicioGrupo + indexSubfila;
                    const fila = ganttSheet.getRow(numeroFila);

                    tareasSubfila.forEach(tarea => {

                        const inicio = fechaLocal(tarea.inicio);
                        const fin = fechaLocal(tarea.fin);

                        if (!inicio || !fin) return;

                        inicio.setHours(0, 0, 0, 0);
                        fin.setHours(0, 0, 0, 0);

                        const inicioIndex = dias.findIndex(d => {

                            const fecha = new Date(d.fecha);
                            fecha.setHours(0, 0, 0, 0);

                            return fecha.getTime() === inicio.getTime();
                        });

                        const finIndex = dias.findIndex(d => {

                            const fecha = new Date(d.fecha);
                            fecha.setHours(0, 0, 0, 0);

                            return fecha.getTime() === fin.getTime();
                        });

                        if (inicioIndex === -1 || finIndex === -1) return;

                        const colInicio = inicioIndex + 3;
                        const colFin = finIndex + 3;

                        try {

                            if (colInicio < colFin) {
                                ganttSheet.mergeCells(
                                    numeroFila,
                                    colInicio,
                                    numeroFila,
                                    colFin
                                );
                            }

                            const barra = fila.getCell(colInicio);

                            barra.value = tarea.producto;

                            barra.fill = {
                                type: "pattern",
                                pattern: "solid",
                                fgColor: {
                                    argb: colorExcelEstadoSuave(tarea.estado)
                                }
                            };

                            barra.font = {
                                bold: true,
                                color: { argb: "FF000000" }
                            };

                            barra.alignment = {
                                horizontal: "center",
                                vertical: "middle",
                                wrapText: true
                            };

                            barra.border = borderBarraExcel(tarea.estado);

                        } catch (mergeError) {

                            console.warn(
                                "No se pudo fusionar barra en Excel:",
                                {
                                    maquina: tarea.maquina,
                                    producto: tarea.producto,
                                    inicio: tarea.inicio,
                                    fin: tarea.fin,
                                    fila: numeroFila,
                                    colInicio,
                                    colFin
                                },
                                mergeError
                            );
                        }
                    });
                });

                /* =========================
                SEPARADOR ENTRE MÁQUINAS
                ========================= */

                const separador = ganttSheet.getRow(filaActual);

                separador.height = 7;

                for (let col = 1; col <= totalColumnas; col++) {

                    const cell = separador.getCell(col);

                    cell.border = {
                        top: { style: "thin", color: { argb: "FFE5E7EB" } }
                    };

                    if (col >= 3) {
                        const dia = dias[col - 3];
                        cell.fill = fondoDiaBaseExcel(dia.fecha);
                    } else {
                        cell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: "FFFFFFFF" }
                        };
                    }
                }

                filaActual++;
            });
        /* =========================
           ANCHOS
        ========================= */

        ganttSheet.getColumn(1).width = 26;
        ganttSheet.getColumn(2).width = 16;

        for (let i = 3; i <= totalColumnas; i++) {
            ganttSheet.getColumn(i).width = 13;
        }

        /* =========================
           DESCARGA
        ========================= */

        const buffer = await workbook.xlsx.writeBuffer();

        const blob = new Blob(
            [buffer],
            {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        );

        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.download = "Carta_Gantt_LAGMET.xlsx";

        link.click();

        URL.revokeObjectURL(link.href);

    } catch (error) {

        console.error("❌ Error al exportar Excel:", error);

        alert("No se pudo generar el Excel");
    }
}

window.descargarGanttExcel = descargarGanttExcel;