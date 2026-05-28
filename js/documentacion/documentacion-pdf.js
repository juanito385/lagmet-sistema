/* =========================
   GENERAR INFORME PDF
========================= */
async function generarInforme(){

    try {
        const response = await fetch("php/produccion/obtener_produccion.php");
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
        logo.src = "/proyecto_lagmet/assets/img/logo-ironix.png";

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

                        if (label === "Pendientes") {
                            dataCell.cell.styles.textColor = [120, 120, 120];
                        }

                        if (label === "En proceso") {
                            dataCell.cell.styles.textColor = [25, 118, 210];
                        }

                        if (label === "Terminados") {
                            dataCell.cell.styles.textColor = [46, 125, 50];
                        }

                        if (label === "Atrasados") {
                            dataCell.cell.styles.textColor = [198, 40, 40];
                        }
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

window.generarInforme = generarInforme;