/* ==================================================
   IRONIX - LOADER JS PRINCIPAL
   Archivo encargado de cargar todas las librerías
   y scripts del sistema en orden controlado.

   Ruta: js/ironix-loader.js
================================================== */

console.log("IRONIX Loader iniciado...");

/*
    Cambia esta versión cuando hagas modificaciones grandes en JS.
    Sirve para evitar problemas de caché en el navegador.
*/
const IRONIX_JS_VERSION = "2026-06-15-02";

/* =========================
   LIBRERÍAS EXTERNAS
========================= */

const IRONIX_LIBRERIAS = [
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    "https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
    "https://unpkg.com/frappe-gantt/dist/frappe-gantt.umd.js",
    "https://cdn.jsdelivr.net/npm/chart.js"
];

/* =========================
   SCRIPTS DEL SISTEMA
   IMPORTANTE:
   Mantener este orden.
========================= */

const IRONIX_SCRIPTS = [

   /* =========================
       LOADER SISTEMA POST-LOGIN
    ========================= */
    "js/login/loader-sistema.js",

    /* =========================
       FLUJO PROCESO
    ========================= */
    "js/flujo/flujo-state.js",
    "js/flujo/flujo-helpers.js",
    "js/flujo/flujo-data.js",
    "js/flujo/flujo-buscador.js",
    "js/flujo/flujo-eventos.js",
    "js/flujo/flujo-acciones-avance.js",
    "js/flujo/flujo-render.js",
    "js/flujo/flujo-operaciones.js",
    "js/flujo/flujo-conectores.js",
    "js/flujo/flujo-detalle-resumen.js",
    "js/flujo/flujo-acciones-generales.js",
    "js/flujo/flujo-modal.js",
    "js/flujo/flujo-numeracion.js",
    "js/flujo/flujo-main.js",
    "js/flujo/flujo-proceso-export.js",

    /* =========================
       CORE
    ========================= */
    "js/core/auth.js",
    "js/core/recuperacion.js",
    "js/core/navigation.js",
    "js/core/layout-loader.js",

    /* =========================
     SIDEBAR
    ========================= */
    "js/sidebar/sidebar.js",

    /* =========================
       PERFIL
    ========================= */
    "js/perfil/perfil-state.js",
    "js/perfil/perfil-helpers.js",
    "js/perfil/perfil-render.js",
    "js/perfil/perfil-data.js",
    "js/perfil/perfil-edicion.js",
    "js/perfil/perfil-password.js",
    "js/perfil/perfil-tabs.js",
    "js/perfil/perfil-events.js",
    "js/perfil/perfil-main.js",

    /* =========================
       LOGIN / RECUPERACIÓN DINÁMICA
    ========================= */
    "js/auth/login-loader.js",

    /* =========================
       PRODUCCIÓN
    ========================= */
    "js/produccion/produccion-config.js",
    "js/produccion/produccion-maquinas.js",
    "js/produccion/produccion-calculo.js",
    "js/produccion/produccion-ui.js",
    "js/produccion/produccion-guardar.js",
    "js/produccion/produccion-eventos.js",
    "js/produccion/produccion-init.js",

    /* =========================
       PRODUCTOS
    ========================= */
    "js/productos/productos-config.js",
    "js/productos/productos-utils.js",
    "js/productos/productos-paginacion.js",
    "js/productos/productos-render.js",
    "js/productos/productos-filtros.js",
    "js/productos/productos-editar.js",
    "js/productos/productos-eliminar.js",

    /* =========================
       DASHBOARD
    ========================= */
    "js/dashboard/dashboard-config.js",
    "js/dashboard/dashboard-utils.js",
    "js/dashboard/dashboard-core.js",
    "js/dashboard/dashboard-cards.js",
    "js/dashboard/dashboard-graficos.js",
    "js/dashboard/dashboard-paneles.js",
    "js/dashboard/dashboard-tabla.js",
    "js/dashboard/dashboard-eventos.js",

    /* =========================
       GANTT
    ========================= */
    "js/gantt/gantt-utils.js",
    "js/gantt/gantt-sidebar.js",
    "js/gantt/gantt-modal.js",
    "js/gantt/gantt-normal.js",
    "js/gantt/gantt-maquinas.js",

    /* =========================
       DOCUMENTACIÓN / EXPORTACIONES
    ========================= */
    "js/documentacion/documentacion-imagen.js",
    "js/documentacion/documentacion-excel-estilos.js",
    "js/documentacion/documentacion-excel.js",
    "js/documentacion/documentacion-pdf.js",
    "js/documentacion/documentacion-gantt-panel.js",
    "js/documentacion/documentacion-gantt-exportar.js",

    /* =========================
       ESTADOS
    ========================= */
    "js/estados/estados-config.js",
    "js/estados/estados-produccion-helpers.js",
    "js/estados/estados-panel.js",
    "js/estados/estados-produccion.js",
    "js/estados/estados-produccion-detalle.js",
    "js/estados/estados-historial-completo.js",
    "js/estados/estados-maquinas.js",
    "js/estados/estados-eventos.js",

    /* =========================
       MAIN
    ========================= */
    "js/core/main.js",

    /* =========================
       CONFIGURACIÓN
    ========================= */
    "js/core/configuracion/configuracion-state.js",
    "js/core/configuracion/configuracion-helpers.js",
    "js/core/configuracion/configuracion-usuarios.js",
    "js/core/configuracion/configuracion-permisos.js",
    "js/core/configuracion/configuracion-modales.js",
    "js/core/configuracion/configuracion-seguridad.js",
    "js/core/configuracion/configuracion-events.js",
    "js/core/configuracion/configuracion-main.js"
];

/* =========================
   HELPERS DEL LOADER
========================= */

function esScriptExternoIronix(ruta) {
    return ruta.startsWith("http://") || ruta.startsWith("https://");
}

function aplicarVersionIronix(ruta) {
    if (esScriptExternoIronix(ruta)) {
        return ruta;
    }

    const separador = ruta.includes("?") ? "&" : "?";
    return `${ruta}${separador}v=${IRONIX_JS_VERSION}`;
}

function cargarScriptSincronicoIronix(ruta) {
    const rutaFinal = aplicarVersionIronix(ruta);

    document.write(
        `<script src="${rutaFinal}" onerror="console.error('Error cargando JS:', '${ruta}')"><\/script>`
    );
}

/* =========================
   CARGA SECUENCIAL
========================= */

[...IRONIX_LIBRERIAS, ...IRONIX_SCRIPTS].forEach(cargarScriptSincronicoIronix);

/* =========================
   CONFIRMACIÓN FINAL
========================= */

document.write(`
<script>
    window.IRONIX_LOADER_LISTO = true;
    console.log("IRONIX Loader finalizado correctamente.");
<\/script>
`);