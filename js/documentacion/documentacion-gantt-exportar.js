/* =========================
   MODAL EXPORTAR IMAGEN GANTT
========================= */

async function cargarModalExportarGantt(){

    const contenedor = document.getElementById("contenedorModalExportarGantt");

    if (!contenedor) return;

    try {
        const respuesta = await fetch(`views/documentacion/gantt-exportar-imagen-modal.html?v=${Date.now()}`, {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar gantt-exportar-imagen-modal.html");
        }

        contenedor.innerHTML = await respuesta.text();

        prepararFechaActualExportacionGantt();

    } catch (error) {
        console.error("Error cargando modal exportar Gantt:", error);
    }
}

function abrirModalExportarGantt(){

    if (typeof cerrarPanelAccionesGantt === "function") {
        cerrarPanelAccionesGantt();
    }

    const modal = document.getElementById("modalExportarImagenGantt");

    if (modal) {
        modal.classList.add("active");
    }
}

function cerrarModalExportarGantt(){

    const modal = document.getElementById("modalExportarImagenGantt");

    if (modal) {
        modal.classList.remove("active");
    }
}

function cambiarTipoExportacionGantt(){

    const tipo = document.querySelector('input[name="tipoExportacionGantt"]:checked')?.value;
    const opcionesMensual = document.getElementById("opcionesExportacionMensual");

    document.querySelectorAll(".export-option").forEach(option => {
        option.classList.remove("active");
    });

    const opcionActiva = document
        .querySelector(`input[name="tipoExportacionGantt"][value="${tipo}"]`)
        ?.closest(".export-option");

    if (opcionActiva) {
        opcionActiva.classList.add("active");
    }

    if (opcionesMensual) {
        opcionesMensual.style.display = tipo === "mensual" ? "grid" : "none";
    }
}

function prepararFechaActualExportacionGantt(){

    const hoy = new Date();

    const selectMes = document.getElementById("selectMesExportarGantt");
    const inputAnio = document.getElementById("selectAnioExportarGantt");

    if (selectMes) {
        selectMes.value = hoy.getMonth();
    }

    if (inputAnio) {
        inputAnio.value = hoy.getFullYear();
    }
}

async function confirmarExportacionGantt(){

    const tipo = document.querySelector('input[name="tipoExportacionGantt"]:checked')?.value || "completa";

    cerrarModalExportarGantt();

    if (tipo === "completa") {
        if (typeof descargarGanttImagen === "function") {
            await descargarGanttImagen();
        }

        return;
    }

    if (tipo === "mensual") {
        alert("Exportación por mes pendiente de implementar.");
    }
}

window.cargarModalExportarGantt = cargarModalExportarGantt;
window.abrirModalExportarGantt = abrirModalExportarGantt;
window.cerrarModalExportarGantt = cerrarModalExportarGantt;
window.cambiarTipoExportacionGantt = cambiarTipoExportacionGantt;
window.confirmarExportacionGantt = confirmarExportacionGantt;