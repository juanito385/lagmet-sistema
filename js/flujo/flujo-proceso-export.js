/* =========================
   FLUJO PROCESO - EXPORTACIÓN
   Imagen PNG / PDF
========================= */

console.log("ARCHIVO flujo-proceso-export.js CARGADO CORRECTAMENTE");

(function () {

    const FLUJO_EXPORT_CONFIG = {
        boardId: "flujoBoard",
        panelOpcionesId: "panelOpcionesFlujo",
        btnImagenId: "btnExportarImagenFlujo",
        btnPdfId: "btnExportarPdfFlujo",
        titulo: "Flujo de proceso",
        sistema: "IRONIX"
    };

        /* =========================
       GUARD EXPORTACIÓN FLUJO
    ========================= */
    function validarPermisoExportarFlujoIronix() {
        /*
            Guardia frontend:
            bloquea exportación de Flujo Proceso si el usuario
            no tiene permiso flujo-proceso.exportar.

            La seguridad real se cerrará después en backend.
        */

        if (typeof usuarioPuedeAccionIronix !== "function") {
            console.warn("No existe usuarioPuedeAccionIronix para validar exportación de flujo");

            alert("No se pudo validar el permiso de exportación");
            return false;
        }

        if (!usuarioPuedeAccionIronix("flujo-proceso", "exportar")) {
            alert("No tienes permisos para exportar Flujo Proceso");
            return false;
        }

        return true;
    }

    /* =========================
       EXPORTAR IMAGEN PNG
    ========================= */
    async function exportarImagen() {
        if (!validarPermisoExportarFlujoIronix()) {
            return;
        }

        cerrarPanelOpcionesExportFlujo();

        if (!validarHtml2CanvasFlujo()) return;

        const board = obtenerBoardExportFlujo();

        if (!board) return;

        const boton = document.getElementById(FLUJO_EXPORT_CONFIG.btnImagenId);
        const restaurarBoton = bloquearBotonExportFlujo(boton, "Exportando...");

        try {
            const canvas = await generarCanvasFlujo(board);

            if (!canvas) return;

            const nombreArchivo = obtenerNombreArchivoFlujo("png");

            descargarCanvasComoPngFlujo(canvas, nombreArchivo);

        } catch (error) {
            console.error("Error exportando imagen del flujo:", error);
            alert("No se pudo exportar la imagen del flujo.");
        } finally {
            restaurarBoton();
        }
    }

    /* =========================
       EXPORTAR PDF
    ========================= */
    async function exportarPdf() {
        if (!validarPermisoExportarFlujoIronix()) {
            return;
        }

        cerrarPanelOpcionesExportFlujo();

        if (!validarHtml2CanvasFlujo()) return;
        if (!validarJsPdfFlujo()) return;

        const board = obtenerBoardExportFlujo();

        if (!board) return;

        const boton = document.getElementById(FLUJO_EXPORT_CONFIG.btnPdfId);
        const restaurarBoton = bloquearBotonExportFlujo(boton, "Exportando...");

        try {
            const canvas = await generarCanvasFlujo(board);

            if (!canvas) return;

            const nombreArchivo = obtenerNombreArchivoFlujo("pdf");

            generarPdfDesdeCanvasFlujo(canvas, nombreArchivo);

        } catch (error) {
            console.error("Error exportando PDF del flujo:", error);
            alert("No se pudo exportar el PDF del flujo.");
        } finally {
            restaurarBoton();
        }
    }

    /* =========================
       VALIDACIONES
    ========================= */
    function validarHtml2CanvasFlujo() {
        if (typeof window.html2canvas !== "function") {
            alert("No se encontró html2canvas. Debes cargar la librería antes de exportar.");
            return false;
        }

        return true;
    }

    function validarJsPdfFlujo() {
        const jsPDF = obtenerJsPdfFlujo();

        if (!jsPDF) {
            alert("No se encontró jsPDF. Debes cargar la librería antes de exportar a PDF.");
            return false;
        }

        return true;
    }

    function obtenerJsPdfFlujo() {
        if (window.jspdf && window.jspdf.jsPDF) {
            return window.jspdf.jsPDF;
        }

        if (window.jsPDF) {
            return window.jsPDF;
        }

        return null;
    }

    function obtenerBoardExportFlujo() {
        const board = document.getElementById(FLUJO_EXPORT_CONFIG.boardId);

        if (!board) {
            alert("No se encontró el tablero del flujo.");
            return null;
        }

        const tieneFlujoRenderizado = board.querySelector(".flujo-grid-proceso");

        if (!tieneFlujoRenderizado) {
            alert("Primero carga un producto para exportar su flujo.");
            return null;
        }

        return board;
    }

    /* =========================
       GENERAR CANVAS
    ========================= */
    async function generarCanvasFlujo(board) {
        await prepararVistaAntesExportarFlujo();

        const contenedorExport = crearContenedorExportFlujo(board);

        try {
            await esperarFuentesFlujo();
            await esperarFrameFlujo();

            const canvas = await html2canvas(contenedorExport, {
                backgroundColor: "#111827",
                scale: obtenerEscalaExportFlujo(),
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: contenedorExport.scrollWidth,
                height: contenedorExport.scrollHeight,
                windowWidth: contenedorExport.scrollWidth,
                windowHeight: contenedorExport.scrollHeight,
                scrollX: 0,
                scrollY: 0
            });

            return canvas;

        } finally {
            contenedorExport.remove();
        }
    }

    async function prepararVistaAntesExportarFlujo() {
        if (typeof window.dibujarConectoresDinamicosFlujo === "function") {
            window.dibujarConectoresDinamicosFlujo();
        }

        await esperarFrameFlujo();
    }

    function crearContenedorExportFlujo(board) {
        inyectarEstilosExportFlujo();

        const rect = board.getBoundingClientRect();

        const anchoBoard = Math.max(
            Math.ceil(rect.width),
            board.scrollWidth,
            1100
        );

        const contenedor = document.createElement("div");

        /*
            IMPORTANTE:
            Se agrega .flujo-proceso-section porque el CSS real del módulo
            está encapsulado bajo esa clase.
        */
        contenedor.className = "flujo-proceso-section flujo-export-wrapper";

        contenedor.style.position = "fixed";
        contenedor.style.left = "-100000px";
        contenedor.style.top = "0";
        contenedor.style.width = `${anchoBoard + 56}px`;
        contenedor.style.padding = "28px";
        contenedor.style.boxSizing = "border-box";
        contenedor.style.background = "#0f172a";
        contenedor.style.color = "#ffffff";
        contenedor.style.zIndex = "-1";
        contenedor.style.overflow = "visible";

        const header = crearHeaderExportFlujo();
        const clone = board.cloneNode(true);

        limpiarCloneExportFlujo(clone);

        clone.removeAttribute("id");
        clone.id = "flujoBoardExport";

        clone.style.width = `${anchoBoard}px`;
        clone.style.maxWidth = "none";
        clone.style.overflow = "visible";

        contenedor.appendChild(header);
        contenedor.appendChild(clone);

        document.body.appendChild(contenedor);

        return contenedor;
    }
    
    function crearHeaderExportFlujo() {
        const header = document.createElement("div");
        header.className = "flujo-export-header";

        const producto = obtenerProductoActualExportFlujo() || "Producto seleccionado";
        const ordenTrabajo = obtenerValorInputExportFlujo("inputOrdenTrabajoFlujo") || "Sin orden";
        const ot = obtenerValorInputExportFlujo("inputOtFlujo") || "Sin OT";
        const fechaDescarga = obtenerFechaDescargaFlujo();

        const detalleHeader = `Producto: ${producto} - Orden de trabajo: ${ordenTrabajo} - OT: ${ot} - Fecha: ${fechaDescarga}`;

        header.innerHTML = `
            <div class="flujo-export-header-top">
                <div>
                    <h1>Flujo de proceso</h1>
                    <p>${escaparTextoExportFlujo(detalleHeader)}</p>
                </div>

                <div class="flujo-export-brand">
                    IRONIX
                </div>
            </div>
        `;

        return header;
    }

    function obtenerFechaDescargaFlujo() {
        const fecha = new Date();

        const dia = String(fecha.getDate()).padStart(2, "0");
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const anio = fecha.getFullYear();

        return `${dia}/${mes}/${anio}`;
    }

    function limpiarCloneExportFlujo(clone) {
        clone.querySelectorAll(".flujo-grid-plus").forEach(btn => btn.remove());

        clone.querySelectorAll("[title]").forEach(elemento => {
            elemento.removeAttribute("title");
        });

        clone.querySelectorAll("button").forEach(btn => {
            btn.remove();
        });

        clone.querySelectorAll("input, select, textarea").forEach(input => {
            input.setAttribute("disabled", "disabled");
        });
    }

    function inyectarEstilosExportFlujo() {
        if (document.getElementById("flujoExportStyles")) return;

        const style = document.createElement("style");
        style.id = "flujoExportStyles";

        style.textContent = `
            .flujo-export-wrapper,
            .flujo-export-wrapper * {
                box-sizing: border-box;
            }

            .flujo-export-wrapper {
                font-family: Inter, Arial, sans-serif;
            }

            .flujo-export-header {
                margin-bottom: 22px;
                padding: 20px 22px;
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 16px;
                background: rgba(255,255,255,0.06);
            }

            .flujo-export-header-top {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 20px;
            }

            .flujo-export-header h1 {
                margin: 0 0 6px 0;
                color: #ffffff;
                font-size: 26px;
                font-weight: 800;
                letter-spacing: 0.2px;
            }

            .flujo-export-header p {
                margin: 0;
                color: rgba(255,255,255,0.68);
                font-size: 14px;
                font-weight: 500;
            }

            .flujo-export-brand {
                padding: 9px 14px;
                border-radius: 999px;
                background: rgba(36,124,255,0.18);
                border: 1px solid rgba(36,124,255,0.4);
                color: #8db8ff;
                font-size: 13px;
                font-weight: 800;
                white-space: nowrap;
            }

            .flujo-export-wrapper #flujoBoardExport {
                overflow: visible !important;
                width: 100% !important;
            }

            .flujo-export-wrapper .flujo-grid-proceso {
                overflow: visible !important;
                width: 100% !important;
            }

            .flujo-export-wrapper .flujo-grid-body,
            .flujo-export-wrapper .flujo-grid-column,
            .flujo-export-wrapper .flujo-grid-card-wrapper {
                overflow: visible !important;
            }

            .flujo-export-wrapper .flujo-grid-plus {
                display: none !important;
            }

            .flujo-export-wrapper .flujo-conectores-svg {
                overflow: visible !important;
                pointer-events: none !important;
            }

            .flujo-export-wrapper button {
                display: none !important;
            }
        `;

        document.head.appendChild(style);
    }
    /* =========================
       DESCARGA PNG
    ========================= */
    function descargarCanvasComoPngFlujo(canvas, nombreArchivo) {
        canvas.toBlob(blob => {
            if (!blob) {
                alert("No se pudo generar la imagen.");
                return;
            }

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = nombreArchivo;
            link.click();

            URL.revokeObjectURL(url);
        }, "image/png", 1);
    }

    /* =========================
       GENERAR PDF
    ========================= */
    function generarPdfDesdeCanvasFlujo(canvas, nombreArchivo) {
        const jsPDF = obtenerJsPdfFlujo();

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        const margen = 8;

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const usableWidth = pageWidth - margen * 2;
        const usableHeight = pageHeight - margen * 2;

        const pageCanvasHeight = Math.floor((usableHeight / usableWidth) * canvas.width);

        let posicionY = 0;
        let pagina = 0;

        while (posicionY < canvas.height) {
            const altoCorte = Math.min(pageCanvasHeight, canvas.height - posicionY);

            const canvasPagina = document.createElement("canvas");
            canvasPagina.width = canvas.width;
            canvasPagina.height = altoCorte;

            const ctx = canvasPagina.getContext("2d");

            ctx.drawImage(
                canvas,
                0,
                posicionY,
                canvas.width,
                altoCorte,
                0,
                0,
                canvas.width,
                altoCorte
            );

            const imgData = canvasPagina.toDataURL("image/png", 1);
            const imgHeight = (altoCorte * usableWidth) / canvas.width;

            if (pagina > 0) {
                pdf.addPage("a4", "landscape");
            }

            pdf.addImage(
                imgData,
                "PNG",
                margen,
                margen,
                usableWidth,
                imgHeight
            );

            posicionY += altoCorte;
            pagina++;
        }

        pdf.save(nombreArchivo);
    }

    /* =========================
       HELPERS UI
    ========================= */
    function cerrarPanelOpcionesExportFlujo() {
        if (typeof window.cerrarPanelOpcionesFlujo === "function") {
            window.cerrarPanelOpcionesFlujo();
            return;
        }

        const panel = document.getElementById(FLUJO_EXPORT_CONFIG.panelOpcionesId);

        if (panel) {
            panel.classList.add("oculto");
        }
    }

    function bloquearBotonExportFlujo(boton, textoTemporal) {
        if (!boton) return () => {};

        const htmlOriginal = boton.innerHTML;
        const pointerOriginal = boton.style.pointerEvents;
        const opacityOriginal = boton.style.opacity;

        boton.innerHTML = `
            <span class="material-symbols-outlined">hourglass_empty</span>
            <div>
                <strong>${textoTemporal}</strong>
                <span>Preparando archivo</span>
            </div>
        `;

        boton.style.pointerEvents = "none";
        boton.style.opacity = "0.7";

        return () => {
            boton.innerHTML = htmlOriginal;
            boton.style.pointerEvents = pointerOriginal;
            boton.style.opacity = opacityOriginal;
        };
    }

    function obtenerEscalaExportFlujo() {
        const dpr = window.devicePixelRatio || 1;

        return Math.min(2, Math.max(1.5, dpr));
    }

    function esperarFrameFlujo() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });
    }

    async function esperarFuentesFlujo() {
        if (document.fonts && document.fonts.ready) {
            try {
                await document.fonts.ready; 
            } catch (error) {
                console.warn("No se pudo esperar la carga de fuentes:", error);
            }
        }
    }

    /* =========================
       HELPERS DATOS
    ========================= */
    function obtenerProductoActualExportFlujo() {
        try {
            if (
                typeof flujoProductoSeleccionado !== "undefined" &&
                flujoProductoSeleccionado &&
                flujoProductoSeleccionado.producto
            ) {
                return flujoProductoSeleccionado.producto;
            }
        } catch (error) {
            console.warn("No se pudo obtener flujoProductoSeleccionado:", error);
        }

        return obtenerValorInputExportFlujo("inputBuscarProductoFlujo") || "Producto seleccionado";
    }

    function obtenerValorInputExportFlujo(id) {
        const input = document.getElementById(id);

        if (!input) return "";

        return String(input.value || "").trim();
    }

    function obtenerNombreArchivoFlujo(extension) {
        const producto = obtenerProductoActualExportFlujo();
        const fecha = new Date();

        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, "0");
        const dd = String(fecha.getDate()).padStart(2, "0");

        const base = `flujo_proceso_${producto}_${yyyy}-${mm}-${dd}`;

        return `${normalizarNombreArchivoFlujo(base)}.${extension}`;
    }

    function normalizarNombreArchivoFlujo(texto) {
        return String(texto || "flujo_proceso")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "")
            .toLowerCase();
    }

    function escaparTextoExportFlujo(texto) {
        return String(texto ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    /* =========================
       API GLOBAL
    ========================= */
    window.flujoProcesoExport = {
        exportarImagen,
        exportarPdf
    };

})();