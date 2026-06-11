/* =========================
   BOTONES SEGÚN ESTADO
========================= */

function actualizarBotonesEstadoUsuarioConfig(usuario) {
    const btnBloquear = document.getElementById("btnBloquearUsuarioConfig");
    const btnDesactivar = document.getElementById("btnDesactivarUsuarioConfig");

    if (!btnBloquear || !btnDesactivar || !usuario) return;

    const esAdmin = usuario.rol === "admin";

    btnBloquear.disabled = esAdmin;
    btnDesactivar.disabled = esAdmin;

    btnBloquear.style.opacity = esAdmin ? "0.45" : "1";
    btnDesactivar.style.opacity = esAdmin ? "0.45" : "1";

    btnBloquear.style.cursor = esAdmin ? "not-allowed" : "pointer";
    btnDesactivar.style.cursor = esAdmin ? "not-allowed" : "pointer";

    if (usuario.estado === "bloqueada") {
        btnBloquear.textContent = "Bloqueado";
        btnBloquear.disabled = true;
        btnBloquear.style.opacity = "0.45";
        btnBloquear.style.cursor = "not-allowed";

        btnDesactivar.textContent = "Activar";
        btnDesactivar.disabled = esAdmin;
        btnDesactivar.style.opacity = esAdmin ? "0.45" : "1";
        btnDesactivar.style.cursor = esAdmin ? "not-allowed" : "pointer";
        return;
    }

    if (usuario.estado === "inactiva") {
        btnBloquear.textContent = "Bloquear";
        btnBloquear.disabled = esAdmin;

        btnDesactivar.textContent = "Activar";
        btnDesactivar.disabled = esAdmin;
        btnDesactivar.style.opacity = esAdmin ? "0.45" : "1";
        btnDesactivar.style.cursor = esAdmin ? "not-allowed" : "pointer";
        return;
    }

    btnBloquear.textContent = "Bloquear";
    btnDesactivar.textContent = "Desactivar";
}

/* =========================
   ACTUALIZAR ESTADO USUARIO
========================= */

async function actualizarEstadoUsuarioConfiguracion(nuevoEstado) {
    if (!configUsuarioSeleccionado) {
        alert("Selecciona un usuario primero");
        return;
    }

    const admin = obtenerUsuarioConfiguracion();

    if (!admin || !admin.id || admin.rol !== "admin") {
        alert("No tienes permisos para modificar usuarios");
        return;
    }

    if (configUsuarioSeleccionado.rol === "admin" && nuevoEstado !== "activa") {
        alert("No puedes bloquear o desactivar un administrador");
        return;
    }

    const estadoTexto = formatearEstadoUsuarioConfig(nuevoEstado);

    const confirmar = confirm(
        `¿Seguro que deseas cambiar el estado de ${configUsuarioSeleccionado.nombre} a "${estadoTexto}"?`
    );

    if (!confirmar) return;

    const formData = new FormData();
    formData.append("admin_id", admin.id);
    formData.append("usuario_id", configUsuarioSeleccionado.id);
    formData.append("estado", nuevoEstado);

    try {
        const response = await fetch("php/usuarios/actualizar_estado_usuario.php", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        console.log("Actualizar estado:", data);

        if (!data.success) {
            alert(data.message || "No se pudo actualizar el estado del usuario");
            return;
        }

        alert(data.message || "Estado actualizado correctamente");

        await listarUsuariosConfiguracion(configUsuarioSeleccionado.id);

    } catch (error) {
        console.error("Error actualizando estado:", error);
        alert("Error al actualizar estado del usuario");
    }
}

/* =========================
   MODAL RESTABLECER CONTRASEÑA
========================= */

function abrirModalResetPasswordConfig() {
    if (!configUsuarioSeleccionado) {
        alert("Selecciona un usuario primero");
        return;
    }

    const modal = document.getElementById("modalResetPasswordConfig");

    if (!modal) {
        alert("No se encontró el modal de restablecer contraseña");
        return;
    }

    limpiarModalResetPasswordConfig();

    actualizarTextoConfig("resetPasswordAvatar", obtenerInicialUsuarioConfig(configUsuarioSeleccionado.nombre));
    actualizarTextoConfig("resetPasswordNombre", configUsuarioSeleccionado.nombre || "Usuario seleccionado");
    actualizarTextoConfig("resetPasswordCorreo", configUsuarioSeleccionado.correo || "Sin correo");

    modal.hidden = false;

    setTimeout(() => {
        document.getElementById("resetPasswordNueva")?.focus();
    }, 80);
}

function cerrarModalResetPasswordConfig() {
    const modal = document.getElementById("modalResetPasswordConfig");

    if (!modal) return;

    modal.hidden = true;
}

function limpiarModalResetPasswordConfig() {
    asignarValorConfig("resetPasswordNueva", "");
    asignarValorConfig("resetPasswordConfirmar", "");
}

async function restablecerPasswordUsuarioConfig() {
    if (!configUsuarioSeleccionado) {
        alert("Selecciona un usuario primero");
        return;
    }

    const admin = obtenerUsuarioConfiguracion();

    if (!admin || !admin.id || admin.rol !== "admin") {
        alert("No tienes permisos para restablecer contraseñas");
        return;
    }

    const nuevaPassword = obtenerValorConfig("resetPasswordNueva");
    const confirmarPassword = obtenerValorConfig("resetPasswordConfirmar");

    if (!nuevaPassword || !confirmarPassword) {
        alert("Completa la nueva contraseña y su confirmación");
        return;
    }

    if (nuevaPassword !== confirmarPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    if (nuevaPassword.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return;
    }

    const confirmar = confirm(
        `¿Seguro que deseas restablecer la contraseña de "${configUsuarioSeleccionado.nombre}"?`
    );

    if (!confirmar) return;

    const formData = new FormData();
    formData.append("admin_id", admin.id);
    formData.append("usuario_id", configUsuarioSeleccionado.id);
    formData.append("nueva_password", nuevaPassword);
    formData.append("confirmar_password", confirmarPassword);

    try {
        const response = await fetch("php/usuarios/restablecer_password_usuario.php", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        console.log("Restablecer contraseña:", data);

        if (!data.success) {
            alert(data.message || "No se pudo restablecer la contraseña");
            return;
        }

        alert(data.message || "Contraseña restablecida correctamente");

        cerrarModalResetPasswordConfig();

    } catch (error) {
        console.error("Error restableciendo contraseña:", error);
        alert("Error al restablecer contraseña");
    }
}
