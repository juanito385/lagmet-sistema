/* =========================
   INFORME PDF CARTA GANTT
   FORMATO CARTA VERTICAL
========================= */

async function generarInforme(){

    try {

        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("No se encontró la librería jsPDF");
            return;
        }

        if (typeof capturarGanttImagenParaPDF !== "function") {
            alert("No se encontró la función capturarGanttImagenParaPDF");
            return;
        }

        const { jsPDF } = window.jspdf;

        const response = await fetch("php/produccion/obtener_produccion.php", {
            cache: "no-store"
        });

        const data = await response.json();

        if (!data.success || !data.data || !data.data.length) {
            alert("No hay datos para generar informe");
            return;
        }

        const productos = data.data;

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "letter"
        });

        const logo = await cargarLogoInformeGanttPDF();

        const fechaGeneracion = new Date().toLocaleString("es-CL", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });

        const imagenGantt = await capturarGanttImagenParaPDF();

        const resumen = calcularResumenBasicoInformeGanttPDF(productos);
        const datosOperativos = prepararDatosOperativosGanttPDF(productos);
        const datosRiesgos = prepararRiesgosAccionesGanttPDF(productos, datosOperativos, resumen);
        const periodo = obtenerPeriodoInformeGanttPDF(productos);

        dibujarHeaderInformeGanttPDF(
            doc,
            logo,
            "INFORME OPERATIVO CARTA GANTT - LAGMET",
            fechaGeneracion
        );

        dibujarPaginaResumenEjecutivoGanttPDF(
            doc,
            resumen,
            datosOperativos,
            periodo,
            fechaGeneracion
        );

        doc.addPage();

        dibujarHeaderInformeGanttPDF(
            doc,
            logo,
            "CARGA POR MÁQUINA",
            fechaGeneracion
        );

        dibujarPaginaCargaMaquinaGanttPDF(doc, datosOperativos);

        doc.addPage();

        dibujarHeaderInformeGanttPDF(
            doc,
            logo,
            "TIEMPOS DE PRODUCCIÓN",
            fechaGeneracion
        );

        dibujarPaginaTiemposProduccionGanttPDF(doc, datosOperativos);

        doc.addPage();

        dibujarHeaderInformeGanttPDF(
            doc,
            logo,
            "VISTA CARTA GANTT - PROGRAMACIÓN ACTUAL",
            fechaGeneracion
        );

        dibujarPaginaImagenGanttPDF(doc, imagenGantt, resumen);

        doc.addPage();

        dibujarHeaderInformeGanttPDF(
            doc,
            logo,
            "RIESGOS Y SITUACIONES IDENTIFICADAS",
            fechaGeneracion
        );

        dibujarPaginaRiesgosGanttPDF(doc, datosRiesgos);

        doc.addPage();

        dibujarHeaderInformeGanttPDF(
            doc,
            logo,
            "ACCIONES SUGERIDAS Y CIERRE",
            fechaGeneracion
        );

        dibujarPaginaAccionesCierreGanttPDF(
            doc,
            datosRiesgos,
            resumen,
            datosOperativos
        );

        agregarFooterInformeGanttPDF(doc);

        doc.save("Informe_Operativo_Carta_Gantt_LAGMET.pdf");

    } catch (error) {

        console.error("Error generando informe operativo Carta Gantt:", error);
        alert("Error al generar informe PDF");
    }
}

/* =========================
   HELPERS PDF BASE
========================= */

async function cargarLogoInformeGanttPDF(){

    return new Promise(resolve => {

        const logo = new Image();

        logo.onload = function(){
            resolve(logo);
        };

        logo.onerror = function(){
            console.warn("No se pudo cargar el logo IRONIX. El informe se generará sin imagen.");
            resolve(null);
        };

        logo.src = "/proyecto_lagmet/assets/img/logo-ironix.png";
    });
}

function dibujarHeaderInformeGanttPDF(doc, logo, titulo, fechaGeneracion){

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(8, 22, 55);
    doc.rect(8, 8, pageWidth - 16, 27, "F");

    if (logo) {
        doc.addImage(logo, "PNG", 13, 15, 32, 12);
    } else {
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("IRONIX", 15, 25);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");

    const anchoDisponibleTitulo = pageWidth - 100;
    let fontSizeTitulo = 12;

    doc.setFontSize(fontSizeTitulo);

    while (doc.getTextWidth(titulo) > anchoDisponibleTitulo && fontSizeTitulo > 8.5) {
        fontSizeTitulo -= 0.5;
        doc.setFontSize(fontSizeTitulo);
    }

    doc.text(
        titulo,
        pageWidth / 2,
        24,
        { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);

    doc.text("Generado:", pageWidth - 44, 18);
    doc.text(fechaGeneracion, pageWidth - 44, 26);

    doc.setDrawColor(245, 124, 0);
    doc.setLineWidth(1);
    doc.line(8, 37, pageWidth - 8, 37);
}

function agregarFooterInformeGanttPDF(doc){

    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {

        doc.setPage(i);

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setDrawColor(245, 124, 0);
        doc.setLineWidth(0.35);
        doc.line(8, pageHeight - 16, pageWidth - 8, pageHeight - 16);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(8, 22, 55);

        doc.text(
            "IRONIX - Informe operativo Carta Gantt generado automáticamente",
            12,
            pageHeight - 8
        );

        doc.text(
            `Página ${i} de ${totalPages}`,
            pageWidth - 34,
            pageHeight - 8
        );
    }
}

function dibujarLeyendaGanttPDF(doc, x, y, anchoDisponible){

    const boxW = anchoDisponible || (doc.internal.pageSize.getWidth() - 28);
    const boxH = 38;

    const gap = 6;
    const leftW = 122;
    const rightW = boxW - leftW - gap;

    const leftX = x;
    const rightX = x + leftW + gap;

    /* =========================
       CONTENEDOR GENERAL
    ========================= */

    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(8, 22, 55);
    doc.text("Leyenda Carta Gantt", x + 6, y + 8);

    /* =========================
       HELPER ITEM
    ========================= */

    function dibujarItemLeyenda(posX, posY, texto, color){

        doc.setFillColor(...color);
        doc.rect(posX, posY - 3.8, 4.8, 4.8, "F");

        doc.setDrawColor(170, 170, 170);
        doc.rect(posX, posY - 3.8, 4.8, 4.8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.3);
        doc.setTextColor(35, 35, 35);
        doc.text(texto, posX + 7, posY);
    }

    /* =========================
       CAJA IZQUIERDA - ESTADOS
    ========================= */

    doc.setDrawColor(225, 225, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(leftX + 6, y + 13, leftW - 10, 20, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(245, 124, 0);
    doc.text("Estados de producción", leftX + 10, y + 18);

    const estadosY1 = y + 25;
    const estadosY2 = y + 31;

    /* Estados ordenados en grilla fija */
    const estadoCol1 = leftX + 10;
    const estadoCol2 = leftX + 50;
    const estadoCol3 = leftX + 90;

    dibujarItemLeyenda(
        estadoCol1,
        estadosY1,
        "En proceso",
        [255, 217, 102]
    );

    dibujarItemLeyenda(
        estadoCol2,
        estadosY1,
        "Pendiente",
        [189, 215, 238]
    );

    dibujarItemLeyenda(
        estadoCol3,
        estadosY1,
        "Atrasado",
        [255, 205, 210]
    );

    dibujarItemLeyenda(
        estadoCol1,
        estadosY2,
        "Tiempo muerto",
        [252, 228, 214]
    );

    dibujarItemLeyenda(
        estadoCol2,
        estadosY2,
        "Terminado",
        [226, 240, 217]
    );

    /* =========================
       CAJA DERECHA - DÍAS ESPECIALES
    ========================= */

    doc.setDrawColor(225, 225, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(rightX, y + 13, rightW - 6, 20, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(245, 124, 0);
    doc.text("Días especiales", rightX + 5, y + 18);

    dibujarItemLeyenda(
        rightX + 5,
        y + 25,
        "Fin de semana",
        [255, 205, 210]
    );

    dibujarItemLeyenda(
        rightX + 5,
        y + 31,
        "Sábado trabajado",
        [198, 224, 180]
    );

    return boxH;
}

function dibujarCardIndicadorPDF(doc, x, y, w, h, titulo, valor, color = [8, 22, 55]){

    doc.setDrawColor(225, 225, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");

    doc.setTextColor(...color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(String(valor), x + w / 2, y + 8, {
        align: "center"
    });

    doc.setTextColor(70, 70, 70);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.4);

    const lineas = doc.splitTextToSize(titulo, w - 5);
    doc.text(lineas, x + w / 2, y + 14, {
        align: "center"
    });
}

/* =========================
   PÁGINA 1 - RESUMEN EJECUTIVO
========================= */

function dibujarPaginaResumenEjecutivoGanttPDF(doc, resumen, datosOperativos, periodo, fechaGeneracion){

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setTextColor(8, 22, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Resumen ejecutivo-operativo", 14, 50);

    /* =========================
       DATOS GENERALES
    ========================= */

    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 57, pageWidth - 28, 29, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(8, 22, 55);

    doc.text("Empresa:", 20, 67);
    doc.text("Área:", 20, 77);
    doc.text("Módulo:", 110, 67);
    doc.text("Período:", 110, 77);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(35, 35, 35);

    doc.text("LAGMET", 42, 67);
    doc.text("Producción", 42, 77);
    doc.text("Carta Gantt", 134, 67);
    doc.text(periodo, 134, 77);

    doc.setTextColor(90, 90, 90);
    doc.setFontSize(7.2);
    doc.text(`Generado: ${fechaGeneracion}`, 20, 84);

    /* =========================
       INDICADORES PRINCIPALES
    ========================= */

    doc.setTextColor(245, 124, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Indicadores principales", 14, 102);

    const cardW = 42;
    const cardH = 20;
    const gap = 5;

    const indicCardY1 = 109;

    dibujarCardIndicadorPDF(
        doc,
        14,
        indicCardY1,
        cardW,
        cardH,
        "Total productos",
        resumen.totalProductos,
        [8, 22, 55]
    );

    dibujarCardIndicadorPDF(
        doc,
        14 + (cardW + gap),
        indicCardY1,
        cardW,
        cardH,
        "Máquinas utilizadas",
        datosOperativos.cargaPorMaquina.length,
        [8, 22, 55]
    );

    dibujarCardIndicadorPDF(
        doc,
        14 + (cardW + gap) * 2,
        indicCardY1,
        cardW,
        cardH,
        "En proceso",
        resumen.enProceso,
        [180, 120, 0]
    );

    dibujarCardIndicadorPDF(
        doc,
        14 + (cardW + gap) * 3,
        indicCardY1,
        cardW,
        cardH,
        "Terminados",
        resumen.terminados,
        [20, 130, 60]
    );

    const indicCardY2 = 135;

    dibujarCardIndicadorPDF(
        doc,
        14,
        indicCardY2,
        cardW,
        cardH,
        "Pendientes",
        resumen.pendientes,
        [30, 90, 200]
    );

    dibujarCardIndicadorPDF(
        doc,
        14 + (cardW + gap),
        indicCardY2,
        cardW,
        cardH,
        "Atrasados",
        resumen.atrasados,
        [185, 28, 28]
    );

    dibujarCardIndicadorPDF(
        doc,
        14 + (cardW + gap) * 2,
        indicCardY2,
        cardW,
        cardH,
        "Reprogramados",
        datosOperativos.totalReprogramados,
        [180, 90, 0]
    );

    dibujarCardIndicadorPDF(
        doc,
        14 + (cardW + gap) * 3,
        indicCardY2,
        cardW,
        cardH,
        "Sábados trabajados",
        resumen.sabadosTrabajados,
        [22, 101, 52]
    );

    /* =========================
       DIAGNÓSTICO OPERATIVO
    ========================= */

    const estadoPlanificacion = resumen.atrasados > 0 ? "Con alertas" : "Estable";

    const nivelAtraso = resumen.atrasados === 0
        ? "Bajo"
        : resumen.atrasados === resumen.totalProductos
            ? "Alto"
            : "Medio";

    doc.setTextColor(245, 124, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Situación operativa", 14, 164);

    const ySituacion = 171;

    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, ySituacion, pageWidth - 28, 78, 2, 2, "FD");

    doc.setTextColor(8, 22, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Diagnóstico operativo del período", 20, ySituacion + 9);

    /* =========================
       HELPER TARJETAS UNIFORMES
    ========================= */

    function dibujarMiniCardSituacion(x, y, titulo, valor, config){

        const miniCardW = 55;
        const miniCardH = 20;

        doc.setDrawColor(...config.borde);
        doc.setFillColor(...config.fondo);
        doc.roundedRect(x, y, miniCardW, miniCardH, 2, 2, "FD");

        doc.setTextColor(70, 70, 70);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(5.8);

        const tituloLineas = doc.splitTextToSize(titulo, miniCardW - 6);

        doc.text(
            tituloLineas,
            x + miniCardW / 2,
            y + 5,
            { align: "center" }
        );

        doc.setTextColor(...config.texto);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.8);

        doc.text(
            String(valor),
            x + miniCardW / 2,
            y + 15.5,
            { align: "center" }
        );
    }

    const rojo = {
        borde: [255, 205, 210],
        fondo: [255, 235, 238],
        texto: [185, 28, 28]
    };

    const amarillo = {
        borde: [255, 243, 191],
        fondo: [255, 251, 235],
        texto: [180, 120, 0]
    };

    const verde = {
        borde: [198, 224, 180],
        fondo: [226, 240, 217],
        texto: [22, 101, 52]
    };

    const azul = {
        borde: [191, 219, 254],
        fondo: [239, 246, 255],
        texto: [30, 90, 200]
    };

    const colorEstado = estadoPlanificacion === "Con alertas" ? rojo : verde;

    const colorNivel = nivelAtraso === "Alto"
        ? rojo
        : nivelAtraso === "Medio"
            ? amarillo
            : verde;

    /* =========================
       POSICIONES UNIFORMES
    ========================= */

    const diagCardX1 = 20;
    const diagCardX2 = 80;
    const diagCardX3 = 140;

    const diagCardY1 = ySituacion + 17;
    const diagCardY2 = ySituacion + 41;

    /* Fila 1 */
    dibujarMiniCardSituacion(
        diagCardX1,
        diagCardY1,
        "Estado planificación",
        estadoPlanificacion,
        colorEstado
    );

    dibujarMiniCardSituacion(
        diagCardX2,
        diagCardY1,
        "Nivel de atraso",
        nivelAtraso,
        colorNivel
    );

    dibujarMiniCardSituacion(
        diagCardX3,
        diagCardY1,
        "Máquinas utilizadas",
        datosOperativos.cargaPorMaquina.length,
        azul
    );

    /* Fila 2 */
    dibujarMiniCardSituacion(
        diagCardX1,
        diagCardY2,
        "Productos en proceso",
        resumen.enProceso,
        amarillo
    );

    dibujarMiniCardSituacion(
        diagCardX2,
        diagCardY2,
        "Productos terminados",
        resumen.terminados,
        verde
    );

    dibujarMiniCardSituacion(
        diagCardX3,
        diagCardY2,
        "Sábados trabajados",
        resumen.sabadosTrabajados,
        verde
    );

    /* =========================
       LECTURA EJECUTIVA
    ========================= */

    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);

    const textoDiagnostico = doc.splitTextToSize(
        `La planificación presenta ${resumen.atrasados} producto(s) atrasado(s) de ${resumen.totalProductos}. ` +
        `Actualmente existen ${resumen.enProceso} orden(es) en ejecución, ${resumen.terminados} terminada(s), ` +
        `${datosOperativos.cargaPorMaquina.length} máquina(s) utilizada(s) y ` +
        `${resumen.sabadosTrabajados} trabajo(s) con actividad registrada en sábado.`,
        pageWidth - 40
    );

    doc.text(textoDiagnostico, 20, ySituacion + 70);
}

/* =========================
   PÁGINA 2 - CARGA POR MÁQUINA
========================= */

function dibujarPaginaCargaMaquinaGanttPDF(doc, datosOperativos){

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setTextColor(245, 124, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Carga por máquina", 14, 50);

    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);

    const descripcion = doc.splitTextToSize(
        "Esta sección resume la distribución de productos por máquina, destacando órdenes en proceso, terminadas y atrasadas para apoyar la priorización operativa.",
        pageWidth - 28
    );

    doc.text(descripcion, 14, 60);

    const filasCarga = datosOperativos.cargaPorMaquina.map(item => {
        return [
            item.maquina,
            item.productosAsignados,
            item.enProceso,
            item.terminados,
            item.atrasados,
            item.observacion
        ];
    });

    doc.autoTable({
        startY: 76,
        margin: { left: 14, right: 14, bottom: 26 },
        head: [[
            "Máquina",
            "Productos",
            "En proceso",
            "Terminados",
            "Atrasados",
            "Observación"
        ]],
        body: filasCarga,
        theme: "grid",
        styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.2,
            valign: "middle",
            overflow: "linebreak"
        },
        headStyles: {
            fillColor: [245, 124, 0],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center"
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248]
        },
        columnStyles: {
            0: { cellWidth: 42, fontStyle: "bold" },
            1: { cellWidth: 22, halign: "center" },
            2: { cellWidth: 25, halign: "center" },
            3: { cellWidth: 25, halign: "center" },
            4: { cellWidth: 25, halign: "center" },
            5: { cellWidth: pageWidth - 28 - 42 - 22 - 25 - 25 - 25 }
        },
        didParseCell: function(dataCell){

            if (dataCell.section === "body") {

                if (dataCell.column.index === 2 && Number(dataCell.cell.raw) > 0) {
                    dataCell.cell.styles.textColor = [180, 120, 0];
                    dataCell.cell.styles.fontStyle = "bold";
                }

                if (dataCell.column.index === 3 && Number(dataCell.cell.raw) > 0) {
                    dataCell.cell.styles.textColor = [20, 130, 60];
                    dataCell.cell.styles.fontStyle = "bold";
                }

                if (dataCell.column.index === 4 && Number(dataCell.cell.raw) > 0) {
                    dataCell.cell.styles.textColor = [185, 28, 28];
                    dataCell.cell.styles.fontStyle = "bold";
                    dataCell.cell.styles.fillColor = [255, 235, 238];
                }
            }
        }
    });

    const finalY = doc.lastAutoTable.finalY || 110;

    doc.setTextColor(245, 124, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Lectura de carga", 14, finalY + 16);

    const maquinasCriticas = datosOperativos.cargaPorMaquina
        .filter(item => Number(item.atrasados || 0) >= 2)
        .map(item => item.maquina);

    const texto = maquinasCriticas.length
        ? `Máquinas con mayor atención requerida: ${maquinasCriticas.join(", ")}. Se recomienda revisar disponibilidad, secuencia de trabajo y causas de atraso.`
        : "No se detectan máquinas con carga crítica según los criterios actuales.";

    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, finalY + 22, pageWidth - 28, 28, 2, 2, "FD");

    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);

    const textoSplit = doc.splitTextToSize(texto, pageWidth - 40);
    doc.text(textoSplit, 20, finalY + 33);
}

/* =========================
   PÁGINA 3 - TIEMPOS DE PRODUCCIÓN
========================= */

function dibujarPaginaTiemposProduccionGanttPDF(doc, datosOperativos){

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setTextColor(245, 124, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Tiempos de producción por orden", 14, 50);

    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);

    const descripcion = doc.splitTextToSize(
        "La tabla compara fecha de inicio, fecha fin estimada y fecha fin real o proyectada, permitiendo identificar diferencias entre planificación y resultado operativo.",
        pageWidth - 28
    );

    doc.text(descripcion, 14, 60);

    const filasTiempos = datosOperativos.tiemposProduccion.map(item => {
        return [
            item.producto,
            item.pedido,
            item.maquinas,
            item.inicio,
            item.finEstimado,
            item.finRealProyectado,
            item.tipoCalculo,
            item.totalHoras,
            item.reprogramado
        ];
    });

    /* =========================
       CENTRADO DE TABLA
       Suma exacta de anchos de columnas
    ========================= */

    const anchoTablaTiempos =
        24 + // Producto
        16 + // Pedido
        30 + // Máquina(s)
        19 + // Inicio
        20 + // Fin est.
        29 + // Fin real / proy.
        21 + // Tipo
        14 + // Horas
        16;  // Reprog.

    const margenTablaTiempos = Math.max(
        8,
        (pageWidth - anchoTablaTiempos) / 2
    );

    doc.autoTable({
        startY: 78,
        tableWidth: anchoTablaTiempos,
        margin: {
            left: margenTablaTiempos,
            right: margenTablaTiempos,
            bottom: 26
        },
        head: [[
            "Producto",
            "Pedido",
            "Máquina(s)",
            "Inicio",
            "Fin est.",
            "Fin real / proy.",
            "Tipo",
            "Horas",
            "Reprog."
        ]],
        body: filasTiempos,
        theme: "grid",
        styles: {
            fontSize: 5.9,
            cellPadding: 1.8,
            lineColor: [220, 220, 220],
            lineWidth: 0.2,
            valign: "middle",
            overflow: "linebreak"
        },
        headStyles: {
            fillColor: [8, 22, 55],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
            fontSize: 5.8
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248]
        },
        columnStyles: {
            0: {
                cellWidth: 24
            },
            1: {
                cellWidth: 16,
                halign: "center"
            },
            2: {
                cellWidth: 30
            },
            3: {
                cellWidth: 19,
                halign: "center"
            },
            4: {
                cellWidth: 20,
                halign: "center"
            },
            5: {
                cellWidth: 29,
                halign: "center"
            },
            6: {
                cellWidth: 21,
                halign: "center",
                fontStyle: "bold"
            },
            7: {
                cellWidth: 14,
                halign: "center",
                fontStyle: "bold"
            },
            8: {
                cellWidth: 16,
                halign: "center"
            }
        },
        didParseCell: function(dataCell){

            if (dataCell.section === "body" && dataCell.column.index === 6) {

                const tipo = String(dataCell.cell.raw || "").toLowerCase();

                if (tipo.includes("real")) {
                    dataCell.cell.styles.textColor = [20, 130, 60];
                    dataCell.cell.styles.fillColor = [226, 240, 217];
                } else if (tipo.includes("reprogramado")) {
                    dataCell.cell.styles.textColor = [180, 90, 0];
                    dataCell.cell.styles.fillColor = [252, 228, 214];
                } else {
                    dataCell.cell.styles.textColor = [30, 90, 200];
                    dataCell.cell.styles.fillColor = [219, 234, 254];
                }

                dataCell.cell.styles.fontStyle = "bold";
            }

            if (dataCell.section === "body" && dataCell.column.index === 8) {

                const valor = String(dataCell.cell.raw || "").toLowerCase();

                if (valor === "sí" || valor === "si") {
                    dataCell.cell.styles.textColor = [180, 90, 0];
                    dataCell.cell.styles.fillColor = [252, 228, 214];
                    dataCell.cell.styles.fontStyle = "bold";
                }
            }
        }
    });

    const finalY = doc.lastAutoTable.finalY || 120;

    const tiemposAltos = datosOperativos.tiemposProduccion.filter(item => {
        return convertirHorasNumeroInformeGanttPDF(item.totalHoras) >= 500;
    });

    doc.setTextColor(245, 124, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Análisis de tiempos", 14, finalY + 15);

    const texto = tiemposAltos.length
        ? `${tiemposAltos.length} producto(s) presentan tiempos totales elevados: ${tiemposAltos.map(item => item.producto).join(", ")}. Se recomienda validar fechas reales y estado de cierre.`
        : "No se detectan tiempos totales elevados bajo el criterio actual.";

    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, finalY + 21, pageWidth - 28, 30, 2, 2, "FD");

    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);

    const textoSplit = doc.splitTextToSize(texto, pageWidth - 40);
    doc.text(textoSplit, 20, finalY + 32);
}

/* =========================
   PÁGINA 4 - IMAGEN GANTT
========================= */

function dibujarPaginaImagenGanttPDF(doc, imagenGantt, resumen){

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setTextColor(8, 22, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Evidencia visual de planificación", 14, 50);

    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);

    const nota = doc.splitTextToSize(
        "La imagen representa la planificación actual de la Carta Gantt, incluyendo máquinas, operadores, fechas, barras de producción, fines de semana y sábado trabajado.",
        pageWidth - 28
    );

    doc.text(nota, 14, 60);

    if (imagenGantt) {

        const props = doc.getImageProperties(imagenGantt);

        const maxW = pageWidth - 24;
        const maxH = 130;

        let imgW = maxW;
        let imgH = (props.height * imgW) / props.width;

        if (imgH > maxH) {
            imgH = maxH;
            imgW = (props.width * imgH) / props.height;
        }

        const imgX = (pageWidth - imgW) / 2;
        const imgY = 82;

        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.rect(imgX - 2, imgY - 2, imgW + 4, imgH + 4);

        doc.addImage(
            imagenGantt,
            "PNG",
            imgX,
            imgY,
            imgW,
            imgH,
            undefined,
            "FAST"
        );

        const yLeyenda = imgY + imgH + 12;

        const altoLeyenda = dibujarLeyendaGanttPDF(
            doc,
            14,
            yLeyenda,
            pageWidth - 28
        );

        const yAlerta = yLeyenda + altoLeyenda + 8;

        doc.setDrawColor(245, 124, 0);
        doc.setFillColor(255, 247, 237);
        doc.roundedRect(14, yAlerta, pageWidth - 28, 26, 2, 2, "FD");

        doc.setTextColor(8, 22, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("Lectura visual", 20, yAlerta + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.7);
        doc.setTextColor(35, 35, 35);

        const textoLectura = doc.splitTextToSize(
            `La vista actual registra ${resumen.totalProductos} producto(s), ${resumen.enProceso} en proceso, ${resumen.terminados} terminado(s), ${resumen.atrasados} atrasado(s) y ${resumen.sabadosTrabajados} sábado(s) trabajado(s).`,
            pageWidth - 40
        );

        doc.text(textoLectura, 20, yAlerta + 17);

    } else {

        doc.setTextColor(180, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("No se pudo capturar la imagen de la Carta Gantt.", 14, 82);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(35, 35, 35);
        doc.text("Revisa que la Carta Gantt esté visible antes de generar el informe.", 14, 94);
    }
}

/* =========================
   PÁGINA 5 - RIESGOS
========================= */

function dibujarPaginaRiesgosGanttPDF(doc, datosRiesgos){

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setTextColor(245, 124, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Riesgos y situaciones identificadas", 14, 50);

    const filasRiesgos = datosRiesgos.riesgos.map(item => {
        return [
            item[0],
            `${item[1]} ${item[2]}`,
            item[3],
            item[4]
        ];
    });

    doc.autoTable({
        startY: 58,
        margin: { left: 8, right: 8, bottom: 26 },
        head: [[
            "Riesgo",
            "Detalle / impacto",
            "Nivel",
            "Productos relacionados"
        ]],
        body: filasRiesgos,
        theme: "grid",
        styles: {
            fontSize: 7.1,
            cellPadding: 2.6,
            lineColor: [220, 220, 220],
            lineWidth: 0.2,
            valign: "middle",
            overflow: "linebreak"
        },
        headStyles: {
            fillColor: [245, 124, 0],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center"
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248]
        },
        columnStyles: {
            0: { cellWidth: 40, fontStyle: "bold" },
            1: { cellWidth: 80 },
            2: { cellWidth: 22, halign: "center", fontStyle: "bold" },
            3: { cellWidth: pageWidth - 16 - 40 - 80 - 22 }
        },
        didParseCell: function(dataCell){

            if (dataCell.section === "body" && dataCell.column.index === 2) {

                const nivel = String(dataCell.cell.raw || "").toLowerCase();

                if (nivel === "alto") {
                    dataCell.cell.styles.fillColor = [255, 205, 210];
                    dataCell.cell.styles.textColor = [185, 28, 28];
                }

                if (nivel === "medio") {
                    dataCell.cell.styles.fillColor = [252, 228, 214];
                    dataCell.cell.styles.textColor = [180, 90, 0];
                }

                if (nivel === "bajo") {
                    dataCell.cell.styles.fillColor = [226, 240, 217];
                    dataCell.cell.styles.textColor = [22, 101, 52];
                }

                dataCell.cell.styles.fontStyle = "bold";
            }
        }
    });

    const finalY = doc.lastAutoTable.finalY || 150;

    doc.setDrawColor(180, 205, 235);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, finalY + 12, pageWidth - 28, 28, 2, 2, "FD");

    doc.setTextColor(8, 22, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Interpretación", 20, finalY + 21);

    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    const texto = doc.splitTextToSize(
        "Los riesgos identificados permiten priorizar revisión de atrasos, carga crítica por máquina, tiempos reales elevados, trabajo en sábado y observaciones registradas durante la producción.",
        pageWidth - 40
    );

    doc.text(texto, 20, finalY + 30);
}

/* =========================
   PÁGINA 6 - ACCIONES Y CIERRE
========================= */

function dibujarPaginaAccionesCierreGanttPDF(doc, datosRiesgos, resumen, datosOperativos){

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setTextColor(245, 124, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Acciones sugeridas", 14, 50);

    doc.autoTable({
        startY: 58,
        margin: { left: 8, right: 8, bottom: 26 },
        head: [[
            "Acción",
            "Descripción",
            "Responsable",
            "Prioridad"
        ]],
        body: datosRiesgos.acciones,
        theme: "grid",
        styles: {
            fontSize: 6.9,
            cellPadding: 2.4,
            lineColor: [220, 220, 220],
            lineWidth: 0.2,
            valign: "middle",
            overflow: "linebreak"
        },
        headStyles: {
            fillColor: [8, 22, 55],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center"
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248]
        },
        columnStyles: {
            0: { cellWidth: 40, fontStyle: "bold" },
            1: { cellWidth: 82 },
            2: { cellWidth: 42, halign: "center" },
            3: { cellWidth: pageWidth - 16 - 40 - 82 - 42, halign: "center", fontStyle: "bold" }
        },
        didParseCell: function(dataCell){

            if (dataCell.section === "body" && dataCell.column.index === 3) {

                const prioridad = String(dataCell.cell.raw || "").toLowerCase();

                if (prioridad === "alta") {
                    dataCell.cell.styles.fillColor = [255, 205, 210];
                    dataCell.cell.styles.textColor = [185, 28, 28];
                }

                if (prioridad === "media") {
                    dataCell.cell.styles.fillColor = [252, 228, 214];
                    dataCell.cell.styles.textColor = [180, 90, 0];
                }

                if (prioridad === "baja") {
                    dataCell.cell.styles.fillColor = [226, 240, 217];
                    dataCell.cell.styles.textColor = [22, 101, 52];
                }

                dataCell.cell.styles.fontStyle = "bold";
            }
        }
    });

    const finalAccionesY = doc.lastAutoTable.finalY || 120;

    doc.setTextColor(245, 124, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Cierre del informe", 14, finalAccionesY + 16);

    doc.setDrawColor(180, 205, 235);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(14, finalAccionesY + 22, pageWidth - 28, 34, 2, 2, "FD");

    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);

    const textoCierre = doc.splitTextToSize(
        datosRiesgos.cierre,
        pageWidth - 40
    );

    doc.text(textoCierre, 20, finalAccionesY + 34);

    const yUso = finalAccionesY + 68;

    doc.setDrawColor(245, 124, 0);
    doc.setFillColor(255, 247, 237);
    doc.roundedRect(14, yUso, pageWidth - 28, 26, 2, 2, "FD");

    doc.setTextColor(8, 22, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.6);
    doc.text("Uso del informe", 20, yUso + 8);

    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.6);

    const textoUso = doc.splitTextToSize(
        "Este documento debe utilizarse como respaldo operativo de planificación, seguimiento de producción, análisis de desviaciones y toma de decisiones dentro del módulo Carta Gantt de IRONIX.",
        pageWidth - 40
    );

    doc.text(textoUso, 20, yUso + 17);

    const yResumen = yUso + 39;

    doc.setTextColor(245, 124, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Resumen final", 14, yResumen);

    const resumenFinal = [
        ["Productos", resumen.totalProductos],
        ["En proceso", resumen.enProceso],
        ["Terminados", resumen.terminados],
        ["Atrasados", resumen.atrasados],
        ["Sábados", resumen.sabadosTrabajados],
        ["Máquinas", datosOperativos.cargaPorMaquina.length]
    ];

    let x = 14;
    const y = yResumen + 8;
    const w = 30;
    const h = 18;

    resumenFinal.forEach(item => {

        doc.setDrawColor(225, 225, 225);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");

        doc.setTextColor(8, 22, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text(String(item[1]), x + w / 2, y + 7, {
            align: "center"
        });

        doc.setTextColor(70, 70, 70);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.4);
        doc.text(item[0], x + w / 2, y + 13, {
            align: "center"
        });

        x += w + 3;
    });
}

/* =========================
   DATOS OPERATIVOS PARA PDF
========================= */

function prepararDatosOperativosGanttPDF(productos){

    const cargaMap = {};
    const tiemposProduccion = [];

    let totalReprogramados = 0;

    productos.forEach(item => {

        const maquinas = obtenerListaMaquinasInformeGanttPDF(item);
        const estadoTexto = obtenerEstadoTextoInformeGanttPDF(item);
        const atrasado = esProductoAtrasadoInformeGanttPDF(item);
        const reprogramado = esProductoReprogramadoInformeGanttPDF(item);
        const trabajaSabado = normalizarSiNoInformeGanttPDF(
            item.trabaja_sabado ?? item.trabajaSabado
        );

        if (reprogramado) totalReprogramados++;

        maquinas.forEach(maquina => {

            if (!cargaMap[maquina]) {
                cargaMap[maquina] = {
                    maquina,
                    productosAsignados: 0,
                    enProceso: 0,
                    terminados: 0,
                    atrasados: 0,
                    sabados: 0,
                    observacion: ""
                };
            }

            cargaMap[maquina].productosAsignados++;

            const estadoNormalizado = normalizarEstadoInformeGanttPDF(estadoTexto);

            if (estadoNormalizado === "en_proceso" || estadoNormalizado === "proceso") {
                cargaMap[maquina].enProceso++;
            }

            if (estadoNormalizado === "terminado" || estadoNormalizado === "entregado") {
                cargaMap[maquina].terminados++;
            }

            if (atrasado) {
                cargaMap[maquina].atrasados++;
            }

            if (trabajaSabado) {
                cargaMap[maquina].sabados++;
            }
        });

        const finCalculo = obtenerFechaFinCalculoInformeGanttPDF(item, reprogramado);

        tiemposProduccion.push({
            producto: valorInformeGanttPDF(item.producto),
            pedido: valorInformeGanttPDF(item.numero_pedido),
            maquinas: maquinas.join(", "),
            inicio: formatearFechaCortaInformeGanttPDF(item.fecha),
            finEstimado: formatearFechaCortaInformeGanttPDF(item.fecha_fin),
            finRealProyectado: valorInformeGanttPDF(finCalculo.fecha),
            tipoCalculo: finCalculo.tipo,
            totalHoras: calcularHorasTotalesInformeGanttPDF(
                item.fecha,
                finCalculo.fecha
            ),
            reprogramado: reprogramado ? "Sí" : "No"
        });
    });

    const cargaPorMaquina = Object.values(cargaMap)
        .map(item => {

            if (item.atrasados > 0) {
                item.observacion = "Revisar atrasos";
            } else if (item.enProceso > 0) {
                item.observacion = "Ejecución en curso";
            } else if (item.terminados > 0) {
                item.observacion = "Trabajos finalizados";
            } else {
                item.observacion = "Sin observación";
            }

            return item;
        })
        .sort((a, b) => {
            return a.maquina.localeCompare(b.maquina, "es", {
                numeric: true,
                sensitivity: "base"
            });
        });

    return {
        cargaPorMaquina,
        tiemposProduccion,
        totalReprogramados
    };
}

function prepararRiesgosAccionesGanttPDF(productos, datosOperativos, resumen){

    const riesgos = [];
    const acciones = [];

    const productosAtrasados = productos.filter(item => {
        return esProductoAtrasadoInformeGanttPDF(item);
    });

    const productosSabado = productos.filter(item => {
        return normalizarSiNoInformeGanttPDF(item.trabaja_sabado ?? item.trabajaSabado);
    });

    const productosConObservacion = productos.filter(item => {
        const observacion = obtenerObservacionInformeGanttPDF(item);
        const normalizada = String(observacion || "")
            .trim()
            .toLowerCase();

        return (
            normalizada !== "" &&
            normalizada !== "-" &&
            normalizada !== "no" &&
            normalizada !== "sin observación" &&
            normalizada !== "sin observacion"
        );
    });

    const tiemposAltos = datosOperativos.tiemposProduccion.filter(item => {
        const horas = convertirHorasNumeroInformeGanttPDF(item.totalHoras);
        return horas >= 500;
    });

    const maquinasCriticas = datosOperativos.cargaPorMaquina.filter(item => {
        return Number(item.atrasados || 0) >= 2;
    });

    if (resumen.atrasados > 0) {

        riesgos.push([
            "Productos atrasados",
            `${resumen.atrasados} de ${resumen.totalProductos} productos presentan atraso.`,
            "Posible incumplimiento de fechas planificadas.",
            resumen.atrasados === resumen.totalProductos ? "Alto" : "Medio",
            obtenerNombresProductosInformeGanttPDF(productosAtrasados)
        ]);

        acciones.push([
            "Revisar causas de atraso",
            "Analizar órdenes atrasadas y validar si las fechas reales fueron cerradas correctamente.",
            "Jefe de producción",
            "Alta"
        ]);
    }

    if (resumen.atrasados === resumen.totalProductos && resumen.totalProductos > 0) {

        riesgos.push([
            "Planificación con alerta general",
            "Todos los productos del período figuran como atrasados.",
            "La planificación completa requiere revisión operativa.",
            "Alto",
            "Todos"
        ]);

        acciones.push([
            "Validar planificación completa",
            "Revisar fechas fin estimadas, fechas reales y criterios de cierre de producción.",
            "Producción / Administración",
            "Alta"
        ]);
    }

    if (maquinasCriticas.length > 0) {

        riesgos.push([
            "Máquinas con carga crítica",
            `${maquinasCriticas.length} máquina(s) concentran dos o más productos atrasados.`,
            "Puede existir cuello de botella o sobrecarga operativa.",
            "Alto",
            maquinasCriticas.map(item => item.maquina).join(", ")
        ]);

        acciones.push([
            "Monitorear máquinas críticas",
            "Revisar disponibilidad, carga y secuencia de trabajo en máquinas con mayor atraso.",
            "Planificación",
            "Alta"
        ]);
    }

    if (tiemposAltos.length > 0) {

        riesgos.push([
            "Duraciones reales elevadas",
            `${tiemposAltos.length} producto(s) registran tiempos totales elevados.`,
            "Puede indicar cierre tardío, demora real o falta de actualización de estado.",
            "Medio",
            tiemposAltos.map(item => item.producto).join(", ")
        ]);

        acciones.push([
            "Validar tiempos reales",
            "Confirmar si las fechas reales corresponden al término efectivo de cada producto.",
            "Producción / Calidad",
            "Media"
        ]);
    }

    if (productosSabado.length > 0) {

        riesgos.push([
            "Trabajo en sábado",
            `${productosSabado.length} producto(s) tienen sábado trabajado registrado.`,
            "Extensión de jornada o trabajo excepcional.",
            "Medio",
            obtenerNombresProductosInformeGanttPDF(productosSabado)
        ]);

        acciones.push([
            "Controlar sábados trabajados",
            "Validar motivo del trabajo en sábado y confirmar su impacto en la planificación.",
            "Jefe de área",
            "Media"
        ]);
    }

    if (productosConObservacion.length > 0) {

        riesgos.push([
            "Observaciones registradas",
            `${productosConObservacion.length} producto(s) tienen situación u observación asociada.`,
            "Existe información operacional que debe revisarse.",
            "Medio",
            obtenerNombresProductosInformeGanttPDF(productosConObservacion)
        ]);

        acciones.push([
            "Revisar observaciones",
            "Analizar observaciones de producción, fallas o situaciones registradas en los productos.",
            "Producción",
            "Alta"
        ]);
    }

    if (!riesgos.length) {

        riesgos.push([
            "Sin riesgos críticos",
            "No se detectan riesgos operativos relevantes en la información actual.",
            "Planificación estable.",
            "Bajo",
            "-"
        ]);

        acciones.push([
            "Mantener seguimiento",
            "Continuar monitoreando la Carta Gantt y actualizar estados de producción diariamente.",
            "Planificación",
            "Media"
        ]);
    }

    const accionesUnicas = [];
    const clavesAcciones = new Set();

    acciones.forEach(accion => {

        const clave = accion[0];

        if (!clavesAcciones.has(clave)) {
            clavesAcciones.add(clave);
            accionesUnicas.push(accion);
        }
    });

    return {
        riesgos,
        acciones: accionesUnicas,
        cierre: generarCierreInformeGanttPDF(resumen, riesgos)
    };
}

function calcularResumenBasicoInformeGanttPDF(productos){

    const resumen = {
        totalProductos: productos.length,
        pendientes: 0,
        enProceso: 0,
        terminados: 0,
        entregados: 0,
        atrasados: 0,
        sabadosTrabajados: 0
    };

    productos.forEach(item => {

        const estado = normalizarEstadoInformeGanttPDF(
            item.estado_real ||
            item.estado_actual ||
            item.estado_bd ||
            item.estado
        );

        if (estado === "pendiente") {
            resumen.pendientes++;
        }

        if (estado === "en_proceso" || estado === "proceso") {
            resumen.enProceso++;
        }

        if (estado === "terminado") {
            resumen.terminados++;
        }

        if (estado === "entregado") {
            resumen.entregados++;
        }

        if (
            estado === "atrasado" ||
            estado === "retraso" ||
            item.esta_atrasado === true ||
            item.esta_atrasado === 1
        ) {
            resumen.atrasados++;
        }

        if (normalizarSiNoInformeGanttPDF(item.trabaja_sabado ?? item.trabajaSabado)) {
            resumen.sabadosTrabajados++;
        }
    });

    return resumen;
}

/* =========================
   HELPERS DE DATOS
========================= */

function normalizarEstadoInformeGanttPDF(valor){

    return String(valor || "pendiente")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");
}

function normalizarSiNoInformeGanttPDF(valor){

    if (valor === true || valor === 1) return true;

    const texto = String(valor ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    return ["1", "si", "s", "true", "yes"].includes(texto);
}

function valorInformeGanttPDF(valor){
    return valor === null || valor === undefined || valor === "" ? "-" : String(valor);
}

function obtenerListaMaquinasInformeGanttPDF(item){

    if (item.maquinas_utilizadas && item.maquinas_utilizadas !== "Sin máquina") {
        return String(item.maquinas_utilizadas)
            .split("||")
            .map(maquina => maquina.trim())
            .filter(Boolean);
    }

    if (item.maquina) {
        return [String(item.maquina).trim()];
    }

    return ["Sin máquina"];
}

function obtenerEstadoTextoInformeGanttPDF(item){

    const estado = normalizarEstadoInformeGanttPDF(
        item.estado_real ||
        item.estado_actual ||
        item.estado_bd ||
        item.estado ||
        "pendiente"
    );

    const mapa = {
        pendiente: "Pendiente",
        en_proceso: "En proceso",
        proceso: "En proceso",
        terminado: "Terminado",
        entregado: "Entregado",
        atrasado: "Atrasado",
        retraso: "Atrasado",
        pausado: "Pausado",
        tiempo_muerto: "Tiempo muerto"
    };

    return mapa[estado] || "Pendiente";
}

function esProductoAtrasadoInformeGanttPDF(item){

    if (item.esta_atrasado === true || item.esta_atrasado === 1) {
        return true;
    }

    const estado = normalizarEstadoInformeGanttPDF(
        item.estado_real ||
        item.estado_actual ||
        item.estado_bd ||
        item.estado
    );

    return estado === "atrasado" || estado === "retraso";
}

function esProductoReprogramadoInformeGanttPDF(item){

    if (item.reprogramado === true || item.reprogramado === 1) {
        return true;
    }

    return normalizarSiNoInformeGanttPDF(
        item.reprogramado ||
        item.esta_reprogramado ||
        item.fue_reprogramado
    );
}

function formatearFechaCortaInformeGanttPDF(valor){

    if (!valor) return "-";

    return String(valor)
        .replace("T", " ")
        .substring(0, 10);
}

function parseFechaHoraInformeGanttPDF(valor, usarFinDia = false){

    if (!valor) return null;

    if (valor instanceof Date && !isNaN(valor.getTime())) {
        return valor;
    }

    const texto = String(valor)
        .trim()
        .replace(/\n/g, " ")
        .replace("T", " ");

    const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);

    if (match) {

        const anio = Number(match[1]);
        const mes = Number(match[2]) - 1;
        const dia = Number(match[3]);

        const hora = match[4] !== undefined
            ? Number(match[4])
            : usarFinDia ? 23 : 0;

        const minuto = match[5] !== undefined
            ? Number(match[5])
            : usarFinDia ? 59 : 0;

        const segundo = match[6] !== undefined
            ? Number(match[6])
            : usarFinDia ? 59 : 0;

        return new Date(anio, mes, dia, hora, minuto, segundo);
    }

    const fecha = new Date(valor);

    if (isNaN(fecha.getTime())) return null;

    if (usarFinDia) {
        fecha.setHours(23, 59, 59, 999);
    } else {
        fecha.setHours(0, 0, 0, 0);
    }

    return fecha;
}

function calcularHorasTotalesInformeGanttPDF(fechaInicio, fechaFin){

    const inicio = parseFechaHoraInformeGanttPDF(fechaInicio, false);
    const fin = parseFechaHoraInformeGanttPDF(fechaFin, true);

    if (!inicio || !fin) return "-";

    const diferenciaMs = fin - inicio;

    if (diferenciaMs < 0) return "-";

    const horas = diferenciaMs / (1000 * 60 * 60);

    return String(Math.round(horas * 10) / 10).replace(".", ",");
}

function obtenerFechaFinCalculoInformeGanttPDF(item, reprogramado){

    if (item.fecha_fin_real) {
        return {
            fecha: item.fecha_fin_real,
            tipo: reprogramado ? "Real reprogramado" : "Real"
        };
    }

    if (item.fecha_fin_proyectada) {
        return {
            fecha: item.fecha_fin_proyectada,
            tipo: reprogramado ? "Proyectado reprogramado" : "Proyectado"
        };
    }

    return {
        fecha: item.fecha_fin,
        tipo: "Proyectado"
    };
}

function obtenerObservacionInformeGanttPDF(item){

    return valorInformeGanttPDF(
        item.situacion_descripcion ||
        item.observaciones ||
        item.fallo_maquina ||
        item.maquina_fallo ||
        "-"
    );
}

function obtenerNombresProductosInformeGanttPDF(productos){

    if (!productos.length) return "-";

    const nombres = productos
        .map(item => item.producto || "-")
        .filter(Boolean);

    const unicos = [...new Set(nombres)];

    if (unicos.length > 5) {
        return `${unicos.slice(0, 5).join(", ")} y ${unicos.length - 5} más`;
    }

    return unicos.join(", ");
}

function convertirHorasNumeroInformeGanttPDF(valor){

    if (typeof valor === "number") return valor;

    const texto = String(valor || "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "");

    const numero = parseFloat(texto);

    return isNaN(numero) ? 0 : numero;
}

function generarCierreInformeGanttPDF(resumen, riesgos){

    const nivelAlto = riesgos.some(riesgo => {
        return String(riesgo[3] || "").toLowerCase() === "alto";
    });

    if (nivelAlto) {
        return `El informe consolida la situación operativa de la Carta Gantt. Se identifican ${resumen.atrasados} producto(s) atrasado(s) y se recomienda revisar prioridades, fechas reales y carga por máquina para reducir desviaciones en la planificación.`;
    }

    if (resumen.atrasados > 0) {
        return `El informe muestra una planificación con alertas moderadas. Se recomienda mantener seguimiento sobre los productos atrasados y validar periódicamente el avance real de producción.`;
    }

    return `El informe muestra una planificación estable para el período revisado. Se recomienda mantener la actualización diaria de estados y fechas reales para conservar la trazabilidad productiva.`;
}

function obtenerPeriodoInformeGanttPDF(productos){

    const fechas = [];

    productos.forEach(item => {
        const inicio = parseFechaHoraInformeGanttPDF(item.fecha, false);
        const fin = parseFechaHoraInformeGanttPDF(
            item.fecha_fin_real ||
            item.fecha_fin_proyectada ||
            item.fecha_fin,
            true
        );

        if (inicio) fechas.push(inicio);
        if (fin) fechas.push(fin);
    });

    if (!fechas.length) return "-";

    const minFecha = new Date(Math.min(...fechas));
    const maxFecha = new Date(Math.max(...fechas));

    const formato = fecha => {
        return fecha.toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    return `${formato(minFecha)} al ${formato(maxFecha)}`;
}

window.generarInforme = generarInforme;