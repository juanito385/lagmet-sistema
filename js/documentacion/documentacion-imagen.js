/* =========================
   DESCARGAR IMAGEN GANTT
========================= */
async function descargarGanttImagen() {

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

window.descargarGanttImagen = descargarGanttImagen;