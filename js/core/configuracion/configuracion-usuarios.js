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
    const contenedorPermisos = document.getElementById("configUsuarioSeleccionado");

    if (contenedorPermisos && usuario) {
        const avatarPermisos = contenedorPermisos.querySelector(".config-user-avatar");
        const nombrePermisos = document.getElementById("configPermisoNombre");
        const correoPermisos = document.getElementById("configPermisoCorreo");

        if (avatarPermisos) avatarPermisos.textContent = obtenerInicialUsuarioConfig(usuario.nombre);
        if (nombrePermisos) nombrePermisos.textContent = usuario.nombre || "Usuario";
        if (correoPermisos) correoPermisos.textContent = usuario.correo || "Sin correo";
    }

    /*
        También actualiza el usuario seleccionado del tab Seguridad.
    */
    const contenedorSeguridad = document.querySelector(".config-security-selected-user");

    if (contenedorSeguridad && usuario) {
        const avatarSeguridad = contenedorSeguridad.querySelector(".config-user-avatar");
        const nombreSeguridad = document.getElementById("configSeguridadNombre");
        const correoSeguridad = document.getElementById("configSeguridadCorreo");

        if (avatarSeguridad) avatarSeguridad.textContent = obtenerInicialUsuarioConfig(usuario.nombre);
        if (nombreSeguridad) nombreSeguridad.textContent = usuario.nombre || "Usuario";
        if (correoSeguridad) correoSeguridad.textContent = usuario.correo || "Sin correo";
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
