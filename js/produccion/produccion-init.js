/* =========================
   INICIAR MONITOREO
========================= */
async function iniciarMonitoreo() {
    permitirSoloNumeros("pedido");
    permitirSoloNumeros("ot");
    permitirSoloNumeros("Codigo");

    if (typeof cargarMaquinasDesdeBD === "function") {
        await cargarMaquinasDesdeBD();
    }

    cambiarTabMonitoreo("info");
    actualizarGrupoActual();
}
/* =========================
   FUNCIONES GLOBALES
========================= */
window.abrirModalSituacion = abrirModalSituacion;
window.cerrarModalSituacion = cerrarModalSituacion;
window.guardarSituacion = guardarSituacion;
window.mostrarSelectorMaquinaFallo = mostrarSelectorMaquinaFallo;

window.guardarDatos = guardarDatos;
window.limpiarFormulario = limpiarFormulario;
window.cancelarProduccion = cancelarProduccion;

window.cambiarTabMonitoreo = cambiarTabMonitoreo;
window.iniciarMonitoreo = iniciarMonitoreo;