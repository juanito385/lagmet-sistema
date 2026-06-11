console.log("CONFIGURACION.JS CARGADO");

/* =========================
   CONFIGURACIÓN ADMIN
========================= */

let configUsuarios = [];
let configUsuariosFiltrados = [];
let configUsuarioSeleccionado = null;
let configPermisosSeleccionados = null;

/* =========================
   OBTENER USUARIO ACTUAL
========================= */

function obtenerUsuarioConfiguracion() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        console.error("Error leyendo usuario desde localStorage:", error);
        return null;
    }
}

/* =========================
   VALIDAR ADMIN
========================= */

function usuarioActualEsAdminConfig() {
    const user = obtenerUsuarioConfiguracion();
    return user && user.rol === "admin";
}

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
   LISTAR USUARIOS
========================= */

async function listarUsuariosConfiguracion(usuarioMantenerSeleccionado = null) {
    try {
        const response = await fetch("php/usuarios/listar_usuarios.php", {
            cache: "no-store"
        });

        const data = await response.json();

        console.log("Usuarios configuración:", data);

        if (!data.success) {
            alert(data.message || "No se pudieron cargar los usuarios");
            return;
        }

        configUsuarios = Array.isArray(data.usuarios) ? data.usuarios : [];
        configUsuariosFiltrados = [...configUsuarios];

        renderResumenUsuariosConfiguracion();
        renderTablaUsuariosConfiguracion();

        let usuarioSeleccionar = null;

        if (usuarioMantenerSeleccionado) {
            usuarioSeleccionar = configUsuarios.find(
                usuario => Number(usuario.id) === Number(usuarioMantenerSeleccionado)
            );
        }

        if (!usuarioSeleccionar) {
            usuarioSeleccionar =
                configUsuarios.find(usuario => usuario.rol !== "admin") ||
                configUsuarios[0] ||
                null;
        }

        if (usuarioSeleccionar) {
            await seleccionarUsuarioConfiguracion(usuarioSeleccionar.id);
        }

    } catch (error) {
        console.error("Error listando usuarios:", error);
        alert("Error al cargar usuarios");
    }
}

/* =========================
   RESUMEN SUPERIOR
========================= */

function renderResumenUsuariosConfiguracion() {
    const totalUsuarios = configUsuarios.length;
    const usuariosActivos = configUsuarios.filter(usuario => usuario.estado === "activa").length;
    const totalAdmin = configUsuarios.filter(usuario => usuario.rol === "admin").length;
    const totalUsuario = configUsuarios.filter(usuario => usuario.rol === "usuario").length;

    actualizarTextoConfig("configTotalUsuarios", totalUsuarios);
    actualizarTextoConfig("configUsuariosActivos", usuariosActivos);

    const cardTotal = document.getElementById("configTotalUsuarios")?.parentElement;
    const cardActivos = document.getElementById("configUsuariosActivos")?.parentElement;

    if (cardTotal) {
        const p = cardTotal.querySelector("p");
        if (p) p.textContent = `${totalAdmin} administrador · ${totalUsuario} usuario`;
    }

    if (cardActivos) {
        const p = cardActivos.querySelector("p");
        if (p) {
            p.textContent = usuariosActivos === totalUsuarios
                ? "Todos los usuarios activos"
                : `${usuariosActivos} de ${totalUsuarios} usuarios activos`;
        }
    }

    actualizarTextoConfig("configModulosRestringidos", calcularModulosRestringidosConfig());
}

function calcularModulosRestringidosConfig() {
    const usuarioNormal = configUsuarios.find(usuario => usuario.rol !== "admin");

    if (!usuarioNormal) return 0;

    return 4;
}

/* =========================
   TABLA USUARIOS
========================= */

function renderTablaUsuariosConfiguracion() {
    const tbody = document.getElementById("configUsuariosBody");
    const footer = document.getElementById("configUsuariosFooter");

    if (!tbody) return;

    if (configUsuariosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div style="padding:16px; color:#9fb0d0;">
                        No se encontraron usuarios.
                    </div>
                </td>
            </tr>
        `;

        if (footer) footer.textContent = "Mostrando 0 usuarios";
        return;
    }

    tbody.innerHTML = configUsuariosFiltrados.map(usuario => {
        const inicial = obtenerInicialUsuarioConfig(usuario.nombre);
        const rolClase = usuario.rol === "admin" ? "admin" : "usuario";
        const estadoClase = obtenerClaseEstadoConfig(usuario.estado);
        const estadoTexto = formatearEstadoUsuarioConfig(usuario.estado);

        return `
            <tr data-usuario-id="${usuario.id}">
                <td>
                    <div class="config-user-cell">
                        <div class="config-user-avatar">${inicial}</div>
                        <div>
                            <strong>${escaparHTMLConfig(usuario.nombre)}</strong>
                            <span>ID ${usuario.id}</span>
                        </div>
                    </div>
                </td>

                <td>${escaparHTMLConfig(usuario.correo)}</td>

                <td>
                    <span class="config-role-badge ${rolClase}">
                        ${escaparHTMLConfig(usuario.rol)}
                    </span>
                </td>

                <td>
                    <span class="config-status-dot ${estadoClase}"></span>
                    ${estadoTexto}
                </td>

                <td>
                    <div class="config-table-actions">
                        <button 
                            class="config-btn-table btn-config-editar-usuario" 
                            type="button"
                            data-usuario-id="${usuario.id}"
                        >
                            <span class="material-symbols-outlined">edit</span>
                            Editar
                        </button>

                        <button 
                            class="config-btn-table btn-config-permisos-usuario" 
                            type="button"
                            data-usuario-id="${usuario.id}"
                        >
                            <span class="material-symbols-outlined">shield</span>
                            Permisos
                        </button>

                        <button 
                            class="config-btn-icon btn-config-mas-usuario" 
                            type="button"
                            data-usuario-id="${usuario.id}"
                        >
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    if (footer) {
        footer.textContent = `Mostrando ${configUsuariosFiltrados.length} de ${configUsuarios.length} usuarios`;
    }
}

/* =========================
   SELECCIONAR USUARIO
========================= */

async function seleccionarUsuarioConfiguracion(usuarioId) {
    const usuario = configUsuarios.find(item => Number(item.id) === Number(usuarioId));

    if (!usuario) return;

    configUsuarioSeleccionado = usuario;

    document.querySelectorAll("#configUsuariosBody tr").forEach(row => {
        row.classList.remove("config-row-selected");

        if (Number(row.dataset.usuarioId) === Number(usuarioId)) {
            row.classList.add("config-row-selected");
        }
    });

    pintarUsuarioSeleccionadoConfig(usuario);
    actualizarBotonesEstadoUsuarioConfig(usuario);

    await cargarPermisosUsuarioConfiguracion(usuario.id);
}

/* =========================
   USUARIO SELECCIONADO
========================= */

function pintarUsuarioSeleccionadoConfig(usuario) {
    const contenedor = document.getElementById("configUsuarioSeleccionado");

    if (!contenedor || !usuario) return;

    const avatar = contenedor.querySelector(".config-user-avatar");
    const nombre = document.getElementById("configPermisoNombre");
    const correo = document.getElementById("configPermisoCorreo");

    if (avatar) avatar.textContent = obtenerInicialUsuarioConfig(usuario.nombre);
    if (nombre) nombre.textContent = usuario.nombre || "Usuario";
    if (correo) correo.textContent = usuario.correo || "Sin correo";
}

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
   CARGAR PERMISOS REALES
========================= */

async function cargarPermisosUsuarioConfiguracion(usuarioId) {
    try {
        const response = await fetch(`php/usuarios/obtener_permisos_usuario.php?usuario_id=${usuarioId}`, {
            cache: "no-store"
        });

        const data = await response.json();

        console.log("Permisos usuario:", data);

        if (!data.success) {
            alert(data.message || "No se pudieron cargar los permisos");
            return;
        }

        configPermisosSeleccionados = data.permisos || {};

        pintarPermisosRapidosReales(configUsuarioSeleccionado, configPermisosSeleccionados);

    } catch (error) {
        console.error("Error cargando permisos:", error);
        alert("Error al cargar permisos del usuario");
    }
}

/* =========================
   PINTAR PERMISOS REALES
========================= */

function pintarPermisosRapidosReales(usuario, permisos) {
    if (!usuario) return;

    const checks = document.querySelectorAll(".config-permission-item input[type='checkbox']");

    checks.forEach(check => {
        const modulo = check.dataset.modulo;

        if (usuario.rol === "admin") {
            check.checked = true;
            check.disabled = true;
            return;
        }

        check.disabled = false;

        const permisoModulo = permisos[modulo];

        check.checked = permisoModulo && permisoModulo.ver === true;
    });
}

/* =========================
   GUARDAR PERMISOS
========================= */

async function guardarPermisosConfiguracion() {
    if (!configUsuarioSeleccionado) {
        alert("Selecciona un usuario primero");
        return;
    }

    if (configUsuarioSeleccionado.rol === "admin") {
        alert("El administrador siempre mantiene acceso total.");
        return;
    }

    const checks = document.querySelectorAll(".config-permission-item input[type='checkbox']");
    const permisos = {};

    checks.forEach(check => {
        const modulo = check.dataset.modulo;
        permisos[modulo] = check.checked === true;
    });

    permisos["perfil"] = true;

    const formData = new FormData();
    formData.append("usuario_id", configUsuarioSeleccionado.id);
    formData.append("permisos", JSON.stringify(permisos));

    try {
        const response = await fetch("php/usuarios/guardar_permisos_usuario.php", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        console.log("Guardar permisos:", data);

        if (!data.success) {
            alert(data.message || "No se pudieron guardar los permisos");
            return;
        }

        alert(data.message || "Permisos actualizados correctamente");

        await cargarPermisosUsuarioConfiguracion(configUsuarioSeleccionado.id);

    } catch (error) {
        console.error("Error guardando permisos:", error);
        alert("Error al guardar permisos");
    }
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

/* =========================
   BUSCADOR
========================= */

function filtrarUsuariosConfiguracion(texto) {
    const filtro = texto.trim().toLowerCase();

    if (filtro === "") {
        configUsuariosFiltrados = [...configUsuarios];
    } else {
        configUsuariosFiltrados = configUsuarios.filter(usuario => {
            return (
                String(usuario.nombre || "").toLowerCase().includes(filtro) ||
                String(usuario.correo || "").toLowerCase().includes(filtro) ||
                String(usuario.rol || "").toLowerCase().includes(filtro) ||
                String(usuario.estado || "").toLowerCase().includes(filtro)
            );
        });
    }

    renderTablaUsuariosConfiguracion();
}

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

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        cerrarModalNuevoUsuarioConfig();
        cerrarModalResetPasswordConfig();
    }
});

/* =========================
   TABS VISUALES
========================= */

document.addEventListener("click", function(e) {
    const tab = e.target.closest(".config-admin-tab");

    if (!tab) return;

    document.querySelectorAll(".config-admin-tab").forEach(item => {
        item.classList.remove("active");
    });

    tab.classList.add("active");
});

/* =========================
   HELPERS
========================= */

function actualizarTextoConfig(id, texto) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto;
    }
}

function obtenerValorConfig(id) {
    const elemento = document.getElementById(id);

    if (!elemento) return "";

    return elemento.value.trim();
}

function asignarValorConfig(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.value = valor;
    }
}

function obtenerInicialUsuarioConfig(nombre) {
    if (!nombre) return "U";

    return nombre.trim().charAt(0).toUpperCase();
}

function obtenerClaseEstadoConfig(estado) {
    if (estado === "activa") return "active";
    if (estado === "inactiva") return "inactive";
    if (estado === "bloqueada") return "blocked";

    return "inactive";
}

function formatearEstadoUsuarioConfig(estado) {
    if (estado === "activa") return "Activa";
    if (estado === "inactiva") return "Inactiva";
    if (estado === "bloqueada") return "Bloqueada";

    return "Sin estado";
}

function validarCorreoConfig(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function escaparHTMLConfig(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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