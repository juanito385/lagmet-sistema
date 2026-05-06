
async function descargarGanttImagen(){

    const gantt = document.getElementById("gantt");

    if (!gantt || gantt.innerHTML.trim() === "") {
        alert("Primero debes generar la Carta Gantt");
        return;
    }

    try {
        const canvas = await html2canvas(gantt, {
            scale: 2,
            backgroundColor: "#ffffff"
        });

        const imagen = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = imagen;
        link.download = "Carta_Gantt_LAGMET.png";
        link.click();

    } catch (error) {
        console.error("Error al descargar imagen:", error);
        alert("No se pudo descargar la imagen");
    }
}

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
                if (isNaN(dias) || dias <= 0) dias = 1;
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
            grupo.tareas.sort((a, b) => fechaLocal(a.inicio) - fechaLocal(b.inicio));
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
        titulo.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
        titulo.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF59E0B" }
        };
        titulo.alignment = { horizontal: "center", vertical: "middle" };

        ganttSheet.getRow(1).height = 26;
        ganttSheet.getRow(2).height = 8;

        const headerRow = ganttSheet.getRow(3);
        headerRow.values = ["Máquina", "Operador", ...dias.map(d => d.texto)];
        headerRow.height = 24;

        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: "FF0F172A" } };
            cell.alignment = { horizontal: "center", vertical: "middle" };
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

            row.getCell(1).font = { bold: true, color: { argb: "FF111827" } };
            row.getCell(2).font = { color: { argb: "FF111827" } };

            row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
            row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };

            row.getCell(1).border = borderExcelSuave();
            row.getCell(2).border = borderExcelSuave();

            row.getCell(1).fill = fondoFilaExcel();
            row.getCell(2).fill = fondoFilaExcel();

            dias.forEach((dia, index) => {
                const cell = row.getCell(index + 3);

                cell.border = borderExcelSuave();
                cell.fill = fondoFilaExcel();
                cell.alignment = { horizontal: "center", vertical: "middle" };
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
                        ganttSheet.mergeCells(filaActual, colInicio, filaActual, colFin);
                    }

                    const barra = row.getCell(colInicio);

                    barra.value = tarea.producto;

                    barra.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: colorExcelEstadoSuave(tarea.estado) }
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
                    console.warn("No se pudo fusionar barra:", tarea, mergeError);
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

        /*
        ganttSheet.autoFilter = {
            from: "A3",
            to: `${ganttSheet.getColumn(totalColumnas).letter}3`
        };
        */

        /* =========================
           HOJA 2: DETALLE
        ========================= */
        const detalleSheet = workbook.addWorksheet("Detalle");

        detalleSheet.views = [{ showGridLines: true }];

        detalleSheet.mergeCells("A1:G1");

        const detalleTitulo = detalleSheet.getCell("A1");
        detalleTitulo.value = "DETALLE DE PRODUCCIÓN";
        detalleTitulo.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
        detalleTitulo.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF59E0B" }
        };
        detalleTitulo.alignment = { horizontal: "center", vertical: "middle" };

        detalleSheet.getRow(1).height = 26;
        detalleSheet.getRow(2).height = 24;

        const detalleHeader = detalleSheet.getRow(2);
        detalleHeader.values = [
            "Producto",
            "Nota de venta",
            "Máquina",
            "Operador",
            "Inicio",
            "Fin",
            "Estado"
        ];

        detalleHeader.eachCell(cell => {
            cell.font = { bold: true, color: { argb: "FF0F172A" } };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFB7DEE8" }
            };
            cell.border = borderExcelSuave();
        });

        const registrosOrdenadosDetalle = [];

        ordenMaquinas.forEach(grupo => {
            grupo.tareas.forEach(tarea => {
                registrosOrdenadosDetalle.push(tarea);
            });
        });

        registrosOrdenadosDetalle.forEach((item, index) => {
            const row = detalleSheet.getRow(index + 3);

            row.values = [
                item.producto,
                item.pedido,
                item.maquina,
                item.operador,
                item.inicio,
                item.fin,
                item.estado
            ];

            row.height = 22;

            row.eachCell(cell => {
                cell.border = borderExcelSuave();
                cell.alignment = { vertical: "middle" };
            });

            row.getCell(7).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: colorExcelEstadoSuave(item.estado) }
            };
            row.getCell(7).font = { bold: true };
            row.getCell(7).alignment = { horizontal: "center", vertical: "middle" };
        });

        detalleSheet.getColumn(1).width = 24;
        detalleSheet.getColumn(2).width = 18;
        detalleSheet.getColumn(3).width = 24;
        detalleSheet.getColumn(4).width = 16;
        detalleSheet.getColumn(5).width = 16;
        detalleSheet.getColumn(6).width = 16;
        detalleSheet.getColumn(7).width = 18;

        detalleSheet.autoFilter = {
            from: "A2",
            to: "G2"
        };

        /* =========================
           DESCARGA
        ========================= */
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Carta_Gantt_LAGMET.xlsx";
        link.click();

    } catch (error) {
        console.error("❌ Error al exportar Excel:", error);
        alert("No se pudo generar el Excel");
    }
}

/* =========================
   HELPERS VISUALES EXCEL PRO
========================= */
function borderExcelSuave(){
    return {
        top: { style: "thin", color: { argb: "FFD9D9D9" } },
        left: { style: "thin", color: { argb: "FFD9D9D9" } },
        bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
        right: { style: "thin", color: { argb: "FFD9D9D9" } }
    };
}

function fondoFilaExcel(){
    return {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" }
    };
}

function colorExcelEstadoSuave(estado){
    if (estado === "proceso") return "FF92D050";
    if (estado === "pendiente") return "FF5B9BD5";
    if (estado === "atrasado") return "FFFF4D4D";
    if (estado === "tiempo-muerto") return "FFFFC000";
    if (estado === "terminado") return "FFA6A6A6";
    return "FFFFFFFF";
}

function borderBarraExcel(estado){
    let color = "FF666666";

    if (estado === "proceso") color = "FF2E7D32";
    if (estado === "pendiente") color = "FF1565C0";
    if (estado === "atrasado") color = "FFB71C1C";
    if (estado === "tiempo-muerto") color = "FFB26A00";
    if (estado === "terminado") color = "FF6B7280";

    return {
        top: { style: "medium", color: { argb: color } },
        left: { style: "medium", color: { argb: color } },
        bottom: { style: "medium", color: { argb: color } },
        right: { style: "medium", color: { argb: color } }
    };
}

/* =========================
   ESTILOS EXCEL
========================= */
function borderExcel(){
    return {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } }
    };
}

function colorExcelEstado(estado){
    if (estado === "proceso") return "FF92D050";        // Verde
    if (estado === "pendiente") return "FF5B9BD5";      // Azul
    if (estado === "atrasado") return "FFFF0000";       // Rojo
    if (estado === "tiempo-muerto") return "FFFFC000";  // Naranjo
    if (estado === "terminado") return "FFA6A6A6";      // Gris
    return "FFFFFFFF";
}

async function generarInforme(){

    try {
        const response = await fetch("php/obtener_produccion.php");
        const data = await response.json();

        if (!data.success || !data.data || !data.data.length) {
            alert("No hay datos para generar informe");
            return;
        }

        const productos = data.data;
        const hoy = new Date();

        let pendientes = 0;
        let proceso = 0;
        let terminados = 0;
        let atrasados = 0;

        const filas = productos.map(item => {
            let inicio = new Date(item.fecha);

            let dias = parseInt(item.cantidad);
            if (isNaN(dias) || dias <= 0) dias = 1;

            let fin = new Date(inicio);
            fin.setDate(inicio.getDate() + dias);

            let estado = "Pendiente";

            if (hoy < inicio) {
                estado = "Pendiente";
                pendientes++;
            } else if (hoy >= inicio && hoy <= fin) {
                estado = "En proceso";
                proceso++;
            } else if (hoy > fin) {
                estado = "Terminado";
                terminados++;
            }

            return [
                item.producto || "",
                item.numero_pedido || "",
                item.codigo || "",
                String(item.cantidad || ""),
                item.fecha || "",
                fin.toISOString().split("T")[0],
                estado
            ];
        });

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("landscape", "mm", "a4");

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const logo = new Image();
        logo.src = "img/LOGO-LAGMET.png";

        logo.onload = function(){

            /* =========================
               HEADER CORPORATIVO
            ========================= */
            doc.setFillColor(8, 22, 55);
            doc.rect(0, 0, pageWidth, 28, "F");

            doc.addImage(logo, "PNG", 8, 4, 52, 20);

            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.text("INFORME DE PRODUCCIÓN - LAGMET", 75, 18);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Generado:", pageWidth - 45, 12);
            doc.text(new Date().toLocaleDateString(), pageWidth - 45, 19);

            doc.setDrawColor(245, 124, 0);
            doc.setLineWidth(1.2);
            doc.line(0, 29, pageWidth, 29);

            /* =========================
               INFO GENERAL
            ========================= */
            doc.setTextColor(8, 22, 55);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");

            doc.text("EMPRESA:", 18, 43);
            doc.text("ÁREA:", 18, 53);

            doc.setTextColor(25, 25, 25);
            doc.setFont("helvetica", "normal");
            doc.text("LAGMET", 55, 43);
            doc.text("Producción", 55, 53);

            doc.setDrawColor(245, 124, 0);
            doc.setLineWidth(0.4);
            doc.line(8, 63, pageWidth - 8, 63);

            /* =========================
               RESUMEN GENERAL
            ========================= */
            doc.setTextColor(8, 22, 55);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("RESUMEN GENERAL", 8, 73);

            const resumen = [
                ["Pendientes", pendientes],
                ["En proceso", proceso],
                ["Terminados", terminados],
                ["Atrasados", atrasados],
                ["TOTAL REGISTROS", productos.length]
            ];

            doc.autoTable({
                startY: 78,
                margin: { left: 8 },
                tableWidth: 72,
                head: [["INDICADOR", "CANTIDAD"]],
                body: resumen,
                theme: "grid",
                styles: {
                    fontSize: 9,
                    cellPadding: 3.5,
                    textColor: [8, 22, 55],
                    lineColor: [220, 220, 220],
                    lineWidth: 0.2
                },
                headStyles: {
                    fillColor: [245, 124, 0],
                    textColor: [255, 255, 255],
                    halign: "center",
                    fontStyle: "bold"
                },
                columnStyles: {
                    0: { fontStyle: "bold" },
                    1: { halign: "center", fontStyle: "bold" }
                },
                didParseCell: function(dataCell){
                    if (dataCell.section === "body" && dataCell.column.index === 1) {
                        const label = dataCell.row.raw[0];

                        if (label === "Pendientes") dataCell.cell.styles.textColor = [120, 120, 120];
                        if (label === "En proceso") dataCell.cell.styles.textColor = [25, 118, 210];
                        if (label === "Terminados") dataCell.cell.styles.textColor = [46, 125, 50];
                        if (label === "Atrasados") dataCell.cell.styles.textColor = [198, 40, 40];
                    }
                }
            });

            /* =========================
               DETALLE PRODUCTOS
            ========================= */
            doc.setTextColor(8, 22, 55);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("DETALLE DE PRODUCTOS", 88, 73);

            doc.autoTable({
                startY: 78,
                margin: { left: 88, right: 8 },
                head: [[
                    "PRODUCTO",
                    "N° PEDIDO",
                    "CÓDIGO",
                    "CANTIDAD",
                    "INICIO",
                    "FIN ESTIMADO",
                    "ESTADO"
                ]],
                body: filas,
                theme: "grid",
                styles: {
                    fontSize: 8.5,
                    cellPadding: 3,
                    textColor: [15, 15, 25],
                    lineColor: [220, 220, 220],
                    lineWidth: 0.2,
                    valign: "middle"
                },
                headStyles: {
                    fillColor: [245, 124, 0],
                    textColor: [255, 255, 255],
                    halign: "center",
                    fontStyle: "bold"
                },
                alternateRowStyles: {
                    fillColor: [248, 248, 248]
                },
                columnStyles: {
                    0: { cellWidth: 38 },
                    1: { cellWidth: 25, halign: "center" },
                    2: { cellWidth: 25, halign: "center" },
                    3: { cellWidth: 22, halign: "center" },
                    4: { cellWidth: 27, halign: "center" },
                    5: { cellWidth: 30, halign: "center" },
                    6: { cellWidth: 25, halign: "center", fontStyle: "bold" }
                },
                didParseCell: function(dataCell){
                    if (dataCell.section === "body" && dataCell.column.index === 6) {
                        const estado = dataCell.cell.raw;

                        if (estado === "Pendiente") {
                            dataCell.cell.styles.textColor = [120, 120, 120];
                        }

                        if (estado === "En proceso") {
                            dataCell.cell.styles.textColor = [0, 95, 220];
                        }

                        if (estado === "Terminado") {
                            dataCell.cell.styles.textColor = [20, 140, 60];
                        }

                        if (estado === "Atrasado") {
                            dataCell.cell.styles.textColor = [220, 0, 0];
                        }
                    }
                }
            });

            /* =========================
               FOOTER
            ========================= */
            const totalPages = doc.internal.getNumberOfPages();

            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);

                doc.setDrawColor(245, 124, 0);
                doc.setLineWidth(0.4);
                doc.line(8, pageHeight - 18, pageWidth - 8, pageHeight - 18);

                doc.setFontSize(8.5);
                doc.setTextColor(8, 22, 55);
                doc.setFont("helvetica", "normal");

                doc.text(
                    "Sistema LAGMET - Informe generado automáticamente",
                    12,
                    pageHeight - 10
                );

                doc.text(
                    `Página ${i} de ${totalPages}`,
                    pageWidth - 35,
                    pageHeight - 10
                );
            }

            doc.save("Informe_Produccion_LAGMET.pdf");
        };

        logo.onerror = function(){
            alert("No se pudo cargar el logo. Revisa que exista: img/LOGO-LAGMET.png");
        };

    } catch (error) {
        console.error(error);
        alert("Error al generar informe PDF");
    }
}