/* =========================
   INICIAR CONFIGURACIÓN
========================= */

async function cargarConfiguracion() {
    console.log("Inicializando Configuración Admin...");

    const seccion = document.getElementById("configuracion");

    if (!seccion) return;

    if (!usuarioActualEsAdminConfig()) {
        mostrarBloqueoConfiguracionAdmin();
        return;
    }

    await listarUsuariosConfiguracion();

    console.log("Configuración Admin lista");
}

/* =========================
   BLOQUEO SI NO ES ADMIN
========================= */

function mostrarBloqueoConfiguracionAdmin() {
    const seccion = document.getElementById("configuracion");

    if (!seccion) return;

    seccion.innerHTML = `
        <div class="config-admin-card">
            <div class="config-card-header compact">
                <div>
                    <h3>
                        <span class="material-symbols-outlined">block</span>
                        Acceso restringido
                    </h3>
                    <p>No tienes permisos para administrar esta sección.</p>
                </div>
            </div>
        </div>
    `;
}

/* =========================
   HACER FUNCIONES GLOBALES
========================= */

window.cargarConfiguracion = cargarConfiguracion;
window.listarUsuariosConfiguracion = listarUsuariosConfiguracion;
window.seleccionarUsuarioConfiguracion = seleccionarUsuarioConfiguracion;
window.guardarPermisosConfiguracion = guardarPermisosConfiguracion;
window.actualizarEstadoUsuarioConfiguracion = actualizarEstadoUsuarioConfiguracion;
window.abrirModalNuevoUsuarioConfig = abrirModalNuevoUsuarioConfig;
window.abrirModalEditarUsuarioConfig = abrirModalEditarUsuarioConfig;
window.cerrarModalNuevoUsuarioConfig = cerrarModalNuevoUsuarioConfig;
window.crearUsuarioConfiguracion = crearUsuarioConfiguracion;
window.actualizarUsuarioAdminConfiguracion = actualizarUsuarioAdminConfiguracion;
window.enfocarPanelPermisosConfig = enfocarPanelPermisosConfig;
window.abrirModalResetPasswordConfig = abrirModalResetPasswordConfig;
window.cerrarModalResetPasswordConfig = cerrarModalResetPasswordConfig;
window.restablecerPasswordUsuarioConfig = restablecerPasswordUsuarioConfig;

/* =========================
   DETECTAR CARGA DINÁMICA
========================= */

document.addEventListener("DOMContentLoaded", () => {
    const contenido = document.getElementById("contenido");

    if (!contenido) return;

    const observerConfiguracion = new MutationObserver(() => {
        const seccionConfig = document.getElementById("configuracion");

        if (!seccionConfig) return;

        if (seccionConfig.dataset.inicializado === "true") return;

        seccionConfig.dataset.inicializado = "true";

        cargarConfiguracion();
    });

    observerConfiguracion.observe(contenido, {
        childList: true
    });
});