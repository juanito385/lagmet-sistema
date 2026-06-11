/* =========================
   EVENTOS
========================= */

document.addEventListener("click", async function(e) {
    const filaUsuario = e.target.closest("#configUsuariosBody tr[data-usuario-id]");

    if (filaUsuario && !e.target.closest("button")) {
        await seleccionarUsuarioConfiguracion(filaUsuario.dataset.usuarioId);
        return;
    }

    const btnPermisos = e.target.closest(".btn-config-permisos-usuario");

    if (btnPermisos) {
        await seleccionarUsuarioConfiguracion(btnPermisos.dataset.usuarioId);
        enfocarPanelPermisosConfig();
        return;
    }

    const btnEditar = e.target.closest(".btn-config-editar-usuario");

    if (btnEditar) {
        await seleccionarUsuarioConfiguracion(btnEditar.dataset.usuarioId);
        abrirModalEditarUsuarioConfig(btnEditar.dataset.usuarioId);
        return;
    }

    const btnNuevo = e.target.closest("#btnNuevoUsuarioConfig");

    if (btnNuevo) {
        abrirModalNuevoUsuarioConfig();
        return;
    }

    const btnCerrarModal = e.target.closest("#btnCerrarModalNuevoUsuario");
    const btnCancelarNuevo = e.target.closest("#btnCancelarNuevoUsuario");

    if (btnCerrarModal || btnCancelarNuevo) {
        cerrarModalNuevoUsuarioConfig();
        return;
    }

    const btnGuardarNuevo = e.target.closest("#btnGuardarNuevoUsuario");

    if (btnGuardarNuevo) {
        await guardarModalUsuarioConfig();
        return;
    }

    const overlayModalUsuario = e.target.closest("#modalNuevoUsuarioConfig");

    if (overlayModalUsuario && e.target.id === "modalNuevoUsuarioConfig") {
        cerrarModalNuevoUsuarioConfig();
        return;
    }

    const btnGuardarPermisos = e.target.closest("#btnGuardarPermisosConfig");

    if (btnGuardarPermisos) {
        await guardarPermisosConfiguracion();
        return;
    }

    const btnBloquear = e.target.closest("#btnBloquearUsuarioConfig");

    if (btnBloquear) {
        if (!configUsuarioSeleccionado) {
            alert("Selecciona un usuario primero");
            return;
        }

        await actualizarEstadoUsuarioConfiguracion("bloqueada");
        return;
    }

    const btnDesactivar = e.target.closest("#btnDesactivarUsuarioConfig");

    if (btnDesactivar) {
        if (!configUsuarioSeleccionado) {
            alert("Selecciona un usuario primero");
            return;
        }

        const nuevoEstado = configUsuarioSeleccionado.estado === "activa"
            ? "inactiva"
            : "activa";

        await actualizarEstadoUsuarioConfiguracion(nuevoEstado);
        return;
    }

    const btnReset = e.target.closest("#btnResetPasswordUsuarioConfig");

    if (btnReset) {
        if (!configUsuarioSeleccionado) {
            alert("Selecciona un usuario primero");
            return;
        }

        abrirModalResetPasswordConfig();
        return;
    }

    const btnCerrarReset = e.target.closest("#btnCerrarModalResetPassword");
    const btnCancelarReset = e.target.closest("#btnCancelarResetPassword");

    if (btnCerrarReset || btnCancelarReset) {
        cerrarModalResetPasswordConfig();
        return;
    }

    const btnGuardarReset = e.target.closest("#btnGuardarResetPassword");

    if (btnGuardarReset) {
        await restablecerPasswordUsuarioConfig();
        return;
    }

    const overlayReset = e.target.closest("#modalResetPasswordConfig");

    if (overlayReset && e.target.id === "modalResetPasswordConfig") {
        cerrarModalResetPasswordConfig();
        return;
    }
});

document.addEventListener("input", function(e) {
    if (e.target.id === "configBuscarUsuario") {
        filtrarUsuariosConfiguracion(e.target.value);
    }
});

document.addEventListener("change", function(e) {
    const checkPermiso = e.target.closest(
        ".config-permission-row input[type='checkbox']"
    );

    if (!checkPermiso) return;

    const modulo = checkPermiso.dataset.modulo;
    const accion = checkPermiso.dataset.accion;

    if (accion === "ver") {
        actualizarEstadoFilaPermisosConfig(modulo);
    }
});

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        cerrarModalNuevoUsuarioConfig();
        cerrarModalResetPasswordConfig();
    }
});

/* =========================
   TABS CONFIGURACIÓN
========================= */

document.addEventListener("click", function(e) {
    const tab = e.target.closest(".config-admin-tab");

    if (!tab) return;

    const tabNombre = tab.dataset.configTab;

    activarTabConfiguracion(tabNombre);
});
