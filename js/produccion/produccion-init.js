/* =========================
   INICIAR MONITOREO
========================= */
function iniciarMonitoreo() {
    permitirSoloNumeros("pedido");
    permitirSoloNumeros("ot");
    permitirSoloNumeros("Codigo");

    cargarMaquinasDesdeBD();
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