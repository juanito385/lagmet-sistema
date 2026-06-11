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

async function listarUsuariosConfiguracion() {
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

        const usuarioNormal = configUsuarios.find(usuario => usuario.rol !== "admin");
        const primerUsuario = usuarioNormal || configUsuarios[0] || null;

        if (primerUsuario) {
            await seleccionarUsuarioConfiguracion(primerUsuario.id);
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
    const modulos = [
        "dashboard",
        "monitoreo",
        "productos",
        "documentacion",
        "flujo-proceso",
        "estados",
        "configuracion"
    ];

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

    /*
        Perfil siempre debe quedar visible.
    */
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
        alert("La edición administrativa de usuarios se implementará en el siguiente paso.");
        return;
    }

    const btnNuevo = e.target.closest("#btnNuevoUsuarioConfig");

    if (btnNuevo) {
        alert("La creación de usuarios se implementará en un paso posterior.");
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

        alert(`Bloquear usuario: ${configUsuarioSeleccionado.nombre}. Se conectará al endpoint en el siguiente paso.`);
        return;
    }

    const btnDesactivar = e.target.closest("#btnDesactivarUsuarioConfig");

    if (btnDesactivar) {
        if (!configUsuarioSeleccionado) {
            alert("Selecciona un usuario primero");
            return;
        }

        alert(`Desactivar usuario: ${configUsuarioSeleccionado.nombre}. Se conectará al endpoint en el siguiente paso.`);
        return;
    }

    const btnReset = e.target.closest("#btnResetPasswordUsuarioConfig");

    if (btnReset) {
        if (!configUsuarioSeleccionado) {
            alert("Selecciona un usuario primero");
            return;
        }

        alert(`Restablecer contraseña de: ${configUsuarioSeleccionado.nombre}. Se implementará después.`);
        return;
    }
});

document.addEventListener("input", function(e) {
    if (e.target.id === "configBuscarUsuario") {
        filtrarUsuariosConfiguracion(e.target.value);
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