/* =========================
   CARGAR DATOS DESDE BD
========================= */
async function cargarDatosFlujoProceso() {
    try {
        const respuesta = await fetch("/proyecto_lagmet/php/flujo/listar_flujo_proceso.php", {
            cache: "no-store"
        });

        const data = await respuesta.json();

        if (!data.success) {
            throw new Error(data.message || "No se pudo cargar el flujo de proceso");
        }

        flujoProductosBD = data.productos || [];
        flujoProductosOriginalesBD = clonarEstadoFlujo(flujoProductosBD);

        console.log("Productos flujo cargados:", flujoProductosBD);

    } catch (error) {
        console.error("Error cargando flujo proceso:", error);

        flujoProductosBD = [];
        flujoProductosOriginalesBD = [];
    }
}
