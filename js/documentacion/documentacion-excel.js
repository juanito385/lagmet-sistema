/* =========================
   DESCARGAR EXCEL CARTA GANTT PRO
========================= */
async function descargarGanttExcel(){

    try {
        const response = await fetch("php/produccion/obtener_produccion.php");
        const data = await response.json();

        if (!data.success || !data.data || !data.data.length) {
            alert("No hay datos para exportar a Excel");
            return;
        }

        const registros = data.data.map(item => {
            let inicio = fechaParaGantt(item.fecha);
            let fin = fechaParaGantt(item.fecha_fin);

            if (!inicio) inicio = fechaParaGantt(new Date());

            if (!fin) {
                let dias = parseInt(item.dias);

                if (isNaN(dias) || dias <= 0) {
                    dias = 1;
                }

                fin = sumarDias(inicio, dias);
            }

            if (fechaLocal(inicio) > fechaLocal(fin)) {
                fin = sumarDias(inicio, 1);
            }

            const progress = calcularProgreso(inicio, fin);
            const claseEstado = obtenerClaseEstado(progress, item, fin);

            return {
                producto: item.producto || "Sin nombre",
                pedido: item.numero_pedido || "-",
                maquina: item.maquina || "Sin máquina",
                operador: item.usuario || "Admin",
                inicio,
                fin,
                estado: claseEstado.replace("gantt-", "")
            };
        });

        const fechas = registros
            .flatMap(r => [fechaLocal(r.inicio), fechaLocal(r.fin)])
            .filter(Boolean);

        const minFecha = new Date(Math.min(...fechas));
        const maxFecha = new Date(Math.max(...fechas));

        minFecha.setDate(minFecha.getDate() - 2);
        maxFecha.setDate(maxFecha.getDate() + 2);

        const MS_DIA = 1000 * 60 * 60 * 24;
        const totalDias = Math.floor((maxFecha - minFecha) / MS_DIA);

        const dias = [];

        const diasSemanaExcel = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        for (let i = 0; i <= totalDias; i++) {

                        const fecha = new Date(minFecha);

                        fecha.setDate(minFecha.getDate() + i);

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

        const ordenMaquinas = Object.values(agrupado).sort((a, b) => {
            return a.maquina.localeCompare(b.maquina, "es", {
                numeric: true,
                sensitivity: "base"
            });
        });

        const workbook = new ExcelJS.Workbook();

        /* =========================
           HOJA 1: CARTA GANTT
        ========================= */
        const ganttSheet = workbook.addWorksheet("Carta Gantt");

        ganttSheet.views = [{ showGridLines: true }];

        const totalColumnas = dias.length + 2;

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

        ganttSheet.getRow(1).height = 26;
        ganttSheet.getRow(2).height = 22;
        ganttSheet.getRow(3).height = 20;
        ganttSheet.getRow(4).height = 18;

        /* =========================
        ENCABEZADO MES + DÍA
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

        /* =========================
        FINES DE SEMANA EXCEL
        ========================= */
        function esFinDeSemanaExcel(fecha) {

            const fechaExcel = new Date(fecha);
            const diaSemana = fechaExcel.getDay();

            return diaSemana === 0 || diaSemana === 6;
        }

        function fondoDiaBaseExcel(fecha) {

            if (esFinDeSemanaExcel(fecha)) {
                return {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFE4E6" }
                };
            }

            return fondoFilaExcel();
        }

        function colorHeaderDiaExcel(fecha) {
            return esFinDeSemanaExcel(fecha)
                ? "FFFFCDD2"
                : "FFB7DEE8";
        }

        /*
            Máquina y Operador ocupan las filas 2 y 3,
            para quedar alineados con el encabezado de meses y días.
        */
        ganttSheet.mergeCells(2, 1, 4, 1);
        ganttSheet.mergeCells(2, 2, 4, 2);

        const celdaMaquinaHeader = ganttSheet.getCell(2, 1);
        const celdaOperadorHeader = ganttSheet.getCell(2, 2);

        celdaMaquinaHeader.value = "Máquina";
        celdaOperadorHeader.value = "Operador";

        aplicarEstiloHeaderGanttExcel(celdaMaquinaHeader);
        aplicarEstiloHeaderGanttExcel(celdaOperadorHeader);

        /*
            Fila 2: meses agrupados.
            Fila 3: número de día.
        */
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
                aplicarEstiloHeaderGanttExcel(ganttSheet.getCell(2, col), "FF9FD5E5");
            }

            inicioGrupoMes = finGrupoMes + 1;
        }

        dias.forEach((dia, index) => {

            const col = index + 3;
            const celdaDia = ganttSheet.getCell(3, col);

            /*
                Guardamos el día como número real para evitar
                advertencias de Excel: "número almacenado como texto".
                El formato "00" mantiene visualmente 01, 02, 03, etc.
            */
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

            if (esFinDeSemanaExcel(dia.fecha)) {
                celdaSemana.font = {
                    bold: true,
                    color: { argb: "FFB91C1C" }
                };
            }
        });

        let filaActual = 5;

        ordenMaquinas.forEach(grupo => {

            const row = ganttSheet.getRow(filaActual);

            row.height = 30;

            const celdaMaquina = row.getCell(1);
            const celdaOperador = row.getCell(2);

            /* =========================
            DATOS LATERALES
            ========================= */
            celdaMaquina.value = grupo.maquina;
            celdaOperador.value = grupo.operador || "Admin";

            /* =========================
            ESTILO LATERAL
            ========================= */
            celdaMaquina.font = {
                bold: true,
                color: { argb: "FF000000" }
            };

            celdaOperador.font = {
                bold: false,
                color: { argb: "FF000000" }
            };

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

                const cell = row.getCell(index + 3);

                cell.border = borderExcelSuave();

                cell.fill = fondoDiaBaseExcel(dia.fecha);

                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle"
                };
            });

            grupo.tareas.forEach(tarea => {

                const inicio = fechaLocal(tarea.inicio);
                const fin = fechaLocal(tarea.fin);

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
                            filaActual,
                            colInicio,
                            filaActual,
                            colFin
                        );
                    }

                    const barra = row.getCell(colInicio);

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
                        vertical: "middle"
                    };

                    barra.border = borderBarraExcel(tarea.estado);

                } catch (mergeError) {

                    console.warn(
                        "No se pudo fusionar barra:",
                        tarea,
                        mergeError
                    );
                }
            });

            filaActual++;

            const separador = ganttSheet.getRow(filaActual);

            separador.height = 7;

            for (let col = 1; col <= totalColumnas; col++) {

                const cell = separador.getCell(col);

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

        ganttSheet.getColumn(1).width = 24;
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

    } catch (error) {

        console.error("❌ Error al exportar Excel:", error);

        alert("No se pudo generar el Excel");
    }
}

window.descargarGanttExcel = descargarGanttExcel;