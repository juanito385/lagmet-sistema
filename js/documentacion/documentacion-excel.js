/* =========================
   DESCARGAR EXCEL CARTA GANTT PRO
========================= */
async function descargarGanttExcel(){

    try {
        const response = await fetch("php/obtener_produccion.php");
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

        for (let i = 0; i <= totalDias; i++) {

            const fecha = new Date(minFecha);

            fecha.setDate(minFecha.getDate() + i);

            dias.push({
                fecha,
                texto: fecha.toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "numeric"
                })
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
        ganttSheet.getRow(2).height = 8;

        const headerRow = ganttSheet.getRow(3);

        headerRow.values = [
            "Máquina",
            "Operador",
            ...dias.map(d => d.texto)
        ];

        headerRow.height = 24;

        headerRow.eachCell(cell => {

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
                fgColor: { argb: "FFB7DEE8" }
            };

            cell.border = borderExcelSuave();
        });

        let filaActual = 4;

        ordenMaquinas.forEach(grupo => {

            const row = ganttSheet.getRow(filaActual);

            row.height = 30;

            row.getCell(1).value = grupo.maquina;
            row.getCell(2).value = grupo.operador;

            row.getCell(1).font = {
                bold: true,
                color: { argb: "FF111827" }
            };

            row.getCell(2).font = {
                color: { argb: "FF111827" }
            };

            row.getCell(1).alignment = {
                horizontal: "center",
                vertical: "middle"
            };

            row.getCell(2).alignment = {
                horizontal: "center",
                vertical: "middle"
            };

            row.getCell(1).border = borderExcelSuave();
            row.getCell(2).border = borderExcelSuave();

            row.getCell(1).fill = fondoFilaExcel();
            row.getCell(2).fill = fondoFilaExcel();

            dias.forEach((dia, index) => {

                const cell = row.getCell(index + 3);

                cell.border = borderExcelSuave();

                cell.fill = fondoFilaExcel();

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

                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFFFFF" }
                };
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