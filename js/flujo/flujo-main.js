/* =========================
   INICIAR FLUJO PROCESO
========================= */
async function iniciarFlujoProceso() {
    console.log("Iniciando Flujo Proceso...");

    await cargarDatosFlujoProceso();
    cargarSelectoresFlujoProceso();
    configurarEventosFlujoProceso();

    console.log("Flujo Proceso listo");
}

/* =========================
   FUNCIÓN GLOBAL
========================= */
window.iniciarFlujoProceso = iniciarFlujoProceso;
