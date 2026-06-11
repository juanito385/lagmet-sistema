/* =========================
   PERFIL - CAMBIAR CONTRASEÑA
========================= */

function cambiarPasswordPerfil() {
    const passwordActual = document.getElementById("perfilPasswordActual");
    const passwordNueva = document.getElementById("perfilPasswordNueva");
    const passwordConfirmar = document.getElementById("perfilPasswordConfirmar");

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
        alert("No se encontraron los campos de contraseña");
        return;
    }

    const user = obtenerUsuarioPerfil();

    if (!user || !user.id) {
        alert("No hay usuario logueado");
        return;
    }

    const actual = passwordActual.value.trim();
    const nueva = passwordNueva.value.trim();
    const confirmar = passwordConfirmar.value.trim();

    if (!actual || !nueva || !confirmar) {
        alert("Completa todos los campos");
        return;
    }

    if (nueva !== confirmar) {
        alert("Las contraseñas no coinciden");
        return;
    }

    if (nueva.length < 6) {
        alert("La nueva contraseña debe tener al menos 6 caracteres");
        return;
    }

    const formData = new FormData();
    formData.append("usuario_id", user.id);
    formData.append("actual", actual);
    formData.append("nueva", nueva);
    formData.append("confirmar", confirmar);

    fetch("php/config/cambiar_password.php", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || "Proceso finalizado");

        if (data.success) {
            passwordActual.value = "";
            passwordNueva.value = "";
            passwordConfirmar.value = "";
        }
    })
    .catch(err => {
        console.error("Error al cambiar contraseña desde perfil:", err);
        alert("Error al cambiar contraseña");
    });
}
