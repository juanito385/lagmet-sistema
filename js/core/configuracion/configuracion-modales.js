/* =========================
   MODAL CREAR / EDITAR USUARIO
========================= */

function prepararModalUsuarioConfig(modo, usuario = null) {
    const modal = document.getElementById("modalNuevoUsuarioConfig");
    const inputModo = document.getElementById("modalUsuarioModo");
    const inputId = document.getElementById("modalUsuarioId");

    if (!modal || !inputModo || !inputId) {
        alert("No se encontró la estructura del modal de usuario");
        return false;
    }

    const esEditar = modo === "editar";

    inputModo.value = esEditar ? "editar" : "crear";
    inputId.value = esEditar && usuario ? usuario.id : "";

    actualizarTextoConfig("modalUsuarioTitulo", esEditar ? "Editar usuario" : "Nuevo usuario");

    actualizarTextoConfig(
        "modalUsuarioDescripcion",
        esEditar
            ? "Modifica los datos administrativos del usuario seleccionado."
            : "Crea una nueva cuenta de acceso para IRONIX."
    );

    actualizarTextoConfig(
        "modalUsuarioInfo",
        esEditar
            ? "Si cambias el rol del usuario, sus permisos base se recalcularán automáticamente."
            : "Al crear un usuario, se generarán automáticamente sus permisos iniciales según el rol seleccionado."
    );

    actualizarTextoConfig("modalUsuarioBotonTexto", esEditar ? "Guardar cambios" : "Crear usuario");

    const campoPassword = document.getElementById("campoPasswordNuevoUsuario");

    if (campoPassword) {
        campoPassword.hidden = esEditar;
    }

    if (esEditar && usuario) {
        asignarValorConfig("nuevoUsuarioNombre", usuario.nombre || "");
        asignarValorConfig("nuevoUsuarioCorreo", usuario.correo || "");
        asignarValorConfig("nuevoUsuarioPassword", "");
        asignarValorConfig("nuevoUsuarioRol", usuario.rol || "usuario");
        asignarValorConfig("nuevoUsuarioEstado", usuario.estado || "activa");
        asignarValorConfig("nuevoUsuarioTelefono", usuario.telefono || "");
        asignarValorConfig("nuevoUsuarioArea", usuario.area || "Producción");
        asignarValorConfig("nuevoUsuarioIdioma", usuario.idioma || "Español / Chile");
    } else {
        limpiarFormularioUsuarioConfig();
    }

    modal.hidden = false;

    setTimeout(() => {
        document.getElementById("nuevoUsuarioNombre")?.focus();
    }, 80);

    return true;
}

function abrirModalNuevoUsuarioConfig() {
    prepararModalUsuarioConfig("crear");
}

function abrirModalEditarUsuarioConfig(usuarioId) {
    const usuario = configUsuarios.find(item => Number(item.id) === Number(usuarioId));

    if (!usuario) {
        alert("No se encontró el usuario seleccionado");
        return;
    }

    prepararModalUsuarioConfig("editar", usuario);
}

function cerrarModalNuevoUsuarioConfig() {
    const modal = document.getElementById("modalNuevoUsuarioConfig");

    if (!modal) return;

    modal.hidden = true;
}

function limpiarFormularioUsuarioConfig() {
    asignarValorConfig("nuevoUsuarioNombre", "");
    asignarValorConfig("nuevoUsuarioCorreo", "");
    asignarValorConfig("nuevoUsuarioPassword", "");
    asignarValorConfig("nuevoUsuarioRol", "usuario");
    asignarValorConfig("nuevoUsuarioEstado", "activa");
    asignarValorConfig("nuevoUsuarioTelefono", "");
    asignarValorConfig("nuevoUsuarioArea", "Producción");
    asignarValorConfig("nuevoUsuarioIdioma", "Español / Chile");
}

function obtenerDatosModalUsuarioConfig() {
    return {
        modo: obtenerValorConfig("modalUsuarioModo") || "crear",
        usuarioId: obtenerValorConfig("modalUsuarioId"),
        nombre: obtenerValorConfig("nuevoUsuarioNombre"),
        correo: obtenerValorConfig("nuevoUsuarioCorreo"),
        password: obtenerValorConfig("nuevoUsuarioPassword"),
        rol: obtenerValorConfig("nuevoUsuarioRol") || "usuario",
        estado: obtenerValorConfig("nuevoUsuarioEstado") || "activa",
        telefono: obtenerValorConfig("nuevoUsuarioTelefono"),
        area: obtenerValorConfig("nuevoUsuarioArea") || "Producción",
        idioma: obtenerValorConfig("nuevoUsuarioIdioma") || "Español / Chile"
    };
}

function validarDatosModalUsuarioConfig(datos) {
    if (!datos.nombre || !datos.correo) {
        alert("Completa nombre y correo");
        return false;
    }

    if (datos.modo === "crear" && !datos.password) {
        alert("Completa la contraseña inicial");
        return false;
    }

    if (!validarCorreoConfig(datos.correo)) {
        alert("Correo electrónico no válido");
        return false;
    }

    if (datos.modo === "crear" && datos.password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return false;
    }

    if (!["admin", "usuario"].includes(datos.rol)) {
        alert("Rol no válido");
        return false;
    }

    if (!["activa", "inactiva", "bloqueada"].includes(datos.estado)) {
        alert("Estado no válido");
        return false;
    }

    if (!datos.area) {
        alert("El área no puede quedar vacía");
        return false;
    }

    if (!datos.idioma) {
        alert("El idioma no puede quedar vacío");
        return false;
    }

    return true;
}

async function guardarModalUsuarioConfig() {
    const datos = obtenerDatosModalUsuarioConfig();

    if (datos.modo === "editar") {
        await actualizarUsuarioAdminConfiguracion(datos);
    } else {
        await crearUsuarioConfiguracion(datos);
    }
}

/* =========================
   CREAR USUARIO
========================= */

async function crearUsuarioConfiguracion(datosExternos = null) {
    const admin = obtenerUsuarioConfiguracion();

    if (!admin || !admin.id || admin.rol !== "admin") {
        alert("No tienes permisos para crear usuarios");
        return;
    }

    const datos = datosExternos || obtenerDatosModalUsuarioConfig();

    if (!validarDatosModalUsuarioConfig({ ...datos, modo: "crear" })) return;

    const confirmar = confirm(`¿Deseas crear el usuario "${datos.nombre}"?`);

    if (!confirmar) return;

    const formData = new FormData();
    formData.append("admin_id", admin.id);
    formData.append("nombre", datos.nombre);
    formData.append("correo", datos.correo);
    formData.append("password", datos.password);
    formData.append("rol", datos.rol);
    formData.append("estado", datos.estado);
    formData.append("telefono", datos.telefono);
    formData.append("area", datos.area);
    formData.append("idioma", datos.idioma);

    try {
        const response = await fetch("php/usuarios/crear_usuario.php", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        console.log("Crear usuario:", data);

        if (!data.success) {
            alert(data.message || "No se pudo crear el usuario");
            return;
        }

        alert(data.message || "Usuario creado correctamente");

        cerrarModalNuevoUsuarioConfig();

        const nuevoId = data.usuario?.id || null;

        await listarUsuariosConfiguracion(nuevoId);

    } catch (error) {
        console.error("Error creando usuario:", error);
        alert("Error al crear usuario");
    }
}

/* =========================
   EDITAR USUARIO
========================= */

async function actualizarUsuarioAdminConfiguracion(datos) {
    const admin = obtenerUsuarioConfiguracion();

    if (!admin || !admin.id || admin.rol !== "admin") {
        alert("No tienes permisos para editar usuarios");
        return;
    }

    if (!datos.usuarioId) {
        alert("No se recibió el usuario a editar");
        return;
    }

    if (!validarDatosModalUsuarioConfig({ ...datos, modo: "editar" })) return;

    const confirmar = confirm(`¿Deseas guardar los cambios de "${datos.nombre}"?`);

    if (!confirmar) return;

    const formData = new FormData();
    formData.append("admin_id", admin.id);
    formData.append("usuario_id", datos.usuarioId);
    formData.append("nombre", datos.nombre);
    formData.append("correo", datos.correo);
    formData.append("rol", datos.rol);
    formData.append("estado", datos.estado);
    formData.append("telefono", datos.telefono);
    formData.append("area", datos.area);
    formData.append("idioma", datos.idioma);

    try {
        const response = await fetch("php/usuarios/actualizar_usuario_admin.php", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        console.log("Editar usuario:", data);

        if (!data.success) {
            alert(data.message || "No se pudo actualizar el usuario");
            return;
        }

        alert(data.message || "Usuario actualizado correctamente");

        cerrarModalNuevoUsuarioConfig();

        const usuarioActualizadoId = data.usuario?.id || datos.usuarioId;

        actualizarLocalStorageSiEsUsuarioActualConfig(data.usuario);
        await listarUsuariosConfiguracion(usuarioActualizadoId);

    } catch (error) {
        console.error("Error actualizando usuario:", error);
        alert("Error al actualizar usuario");
    }
}

function actualizarLocalStorageSiEsUsuarioActualConfig(usuarioActualizado) {
    if (!usuarioActualizado) return;

    const user = obtenerUsuarioConfiguracion();

    if (!user || Number(user.id) !== Number(usuarioActualizado.id)) return;

    const actualizado = {
        ...user,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.correo,
        rol: usuarioActualizado.rol,
        estado: usuarioActualizado.estado,
        telefono: usuarioActualizado.telefono,
        area: usuarioActualizado.area,
        idioma: usuarioActualizado.idioma
    };

    localStorage.setItem("user", JSON.stringify(actualizado));

    if (typeof actualizarUsuarioSidebar === "function") {
        actualizarUsuarioSidebar();
    }

    if (typeof aplicarPermisosNavegacion === "function") {
        aplicarPermisosNavegacion();
    }
}
