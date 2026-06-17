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

    /*
        Guardia visual/frontend:
        aunque el botón siga visible por algún motivo,
        también bloqueamos la apertura del modal si no tiene permiso.
    */
    if (
        typeof usuarioPuedeAccionIronix === "function" &&
        !usuarioPuedeAccionIronix("documentacion", "exportar")
    ) {
        alert("No tienes permisos para exportar documentación");
        return;
    }

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

    /*
        Guardia extra:
        evita exportar si alguien intenta ejecutar esta función
        manualmente desde consola.
    */
    if (
        typeof usuarioPuedeAccionIronix === "function" &&
        !usuarioPuedeAccionIronix("documentacion", "exportar")
    ) {
        alert("No tienes permisos para exportar documentación");
        return;
    }

    const tipo = document.querySelector('input[name="tipoExportacionGantt"]:checked')?.value || "completa";

    cerrarModalExportarGantt();

    if (tipo === "completa") {
        if (typeof descargarGanttImagen === "function") {
            await descargarGanttImagen();
        }

        return;
    }

    if (tipo === "mensual") {

        const selectMes = document.getElementById("selectMesExportarGantt");
        const inputAnio = document.getElementById("selectAnioExportarGantt");

        const mes = parseInt(selectMes?.value ?? "");
        const anio = parseInt(inputAnio?.value ?? "");

        if (isNaN(mes) || mes < 0 || mes > 11) {
            alert("Selecciona un mes válido");
            return;
        }

        if (isNaN(anio) || anio < 2020 || anio > 2100) {
            alert("Ingresa un año válido");
            return;
        }

        if (typeof exportarGanttPorMes === "function") {
            await exportarGanttPorMes(mes, anio);
        } else {
            alert("La exportación mensual aún no está disponible");
        }
    }
}

window.cargarModalExportarGantt = cargarModalExportarGantt;
window.abrirModalExportarGantt = abrirModalExportarGantt;
window.cerrarModalExportarGantt = cerrarModalExportarGantt;
window.cambiarTipoExportacionGantt = cambiarTipoExportacionGantt;
window.confirmarExportacionGantt = confirmarExportacionGantt;