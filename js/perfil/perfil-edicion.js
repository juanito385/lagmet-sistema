/* =========================
   PERFIL - ACTIVAR EDICIÓN
========================= */

function activarEdicionPerfil() {
    const user = perfilDatosActuales || obtenerUsuarioPerfil();

    if (!user) {
        alert("No se pudieron cargar los datos del usuario");
        return;
    }

    const view = document.getElementById("perfilInfoView");
    const edit = document.getElementById("perfilInfoEdit");

    if (!view || !edit) return;

    const nombre = document.getElementById("perfilEditNombre");
    const correo = document.getElementById("perfilEditCorreo");
    const telefono = document.getElementById("perfilEditTelefono");
    const area = document.getElementById("perfilEditArea");
    const idioma = document.getElementById("perfilEditIdioma");

    if (nombre) nombre.value = user.nombre || "";
    if (correo) correo.value = user.email || "";
    if (telefono) telefono.value = user.telefono || "";
    if (area) area.value = user.area || "Producción";
    if (idioma) idioma.value = user.idioma || "Español / Chile";

    view.hidden = true;
    edit.hidden = false;

    edit.classList.add("modo-entrada");
}


/* =========================
   PERFIL - CANCELAR EDICIÓN
========================= */

function cancelarEdicionPerfil() {
    const view = document.getElementById("perfilInfoView");
    const edit = document.getElementById("perfilInfoEdit");

    if (!view || !edit) return;

    edit.hidden = true;
    view.hidden = false;

    view.classList.add("modo-salida");
}


/* =========================
   PERFIL - GUARDAR INFORMACIÓN
========================= */

function guardarInformacionPerfil() {
    const user = obtenerUsuarioPerfil();

    if (!user || !user.id) {
        alert("No hay usuario logueado");
        return;
    }

    const nombre = document.getElementById("perfilEditNombre")?.value.trim();
    const correo = document.getElementById("perfilEditCorreo")?.value.trim();
    const telefono = document.getElementById("perfilEditTelefono")?.value.trim();
    const area = document.getElementById("perfilEditArea")?.value.trim();
    const idioma = document.getElementById("perfilEditIdioma")?.value.trim();

    if (!nombre || !correo) {
        alert("Nombre y correo son obligatorios");
        return;
    }

    if (!validarCorreoPerfil(correo)) {
        alert("Correo electrónico no válido");
        return;
    }

    if (!area) {
        alert("El área no puede quedar vacía");
        return;
    }

    if (!idioma) {
        alert("El idioma no puede quedar vacío");
        return;
    }

    const formData = new FormData();
    formData.append("usuario_id", user.id);
    formData.append("nombre", nombre);
    formData.append("correo", correo);
    formData.append("telefono", telefono || "");
    formData.append("area", area);
    formData.append("idioma", idioma);

    fetch("php/config/actualizar_usuario.php", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        console.log("Guardar perfil:", data);

        if (!data.success) {
            alert(data.message || "Error al actualizar perfil");
            return;
        }

        const usuarioActualizado = normalizarUsuarioPerfil(data.usuario || {
            ...user,
            nombre,
            correo,
            telefono,
            area,
            idioma
        });

        perfilDatosActuales = usuarioActualizado;

        actualizarLocalStoragePerfil(usuarioActualizado);
        pintarDatosPerfil(usuarioActualizado);
        cancelarEdicionPerfil();

        if (typeof actualizarUsuarioSidebar === "function") {
            actualizarUsuarioSidebar();
        }

        alert(data.message || "Datos actualizados correctamente");
    })
    .catch(err => {
        console.error("Error al guardar información del perfil:", err);
        alert("Error al guardar información del perfil");
    });
}
