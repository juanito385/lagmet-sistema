/* =========================
   PERFIL - EVENTOS BOTONES
========================= */

document.addEventListener("click", function (e) {

    const btnCambiarPassword = e.target.closest("#btnCambiarPasswordPerfil");
    if (btnCambiarPassword) {
        cambiarPasswordPerfil();
        return;
    }

    const btnEditarInfo = e.target.closest("#btnEditarInfoPerfil");
    if (btnEditarInfo) {
        activarEdicionPerfil();
        return;
    }

    const btnCancelarInfo = e.target.closest("#btnCancelarInfoPerfil");
    if (btnCancelarInfo) {
        cancelarEdicionPerfil();
        return;
    }

    const btnGuardarInfo = e.target.closest("#btnGuardarInfoPerfil");
    if (btnGuardarInfo) {
        guardarInformacionPerfil();
        return;
    }

});
