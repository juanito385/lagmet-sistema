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

    const checks = document.querySelectorAll(
        ".config-permission-row input[type='checkbox']"
    );

    checks.forEach(check => {
        const modulo = check.dataset.modulo;
        const accion = check.dataset.accion;

        if (!modulo || !accion) return;

        /*
            Admin siempre mantiene permisos completos.
        */
        if (usuario.rol === "admin") {
            check.checked = true;
            check.disabled = true;
            return;
        }

        const accionDisponible = accionDisponiblePermisosConfig(modulo, accion);

        /*
            Acciones no aplicables quedan bloqueadas.
        */
        if (!accionDisponible) {
            check.checked = false;
            check.disabled = true;
            return;
        }

        /*
            Perfil siempre debe estar visible.
        */
        if (modulo === "perfil" && accion === "ver") {
            check.checked = true;
            check.disabled = true;
            return;
        }

        const permisoModulo = permisos[modulo] || {};

        check.checked = permisoModulo[accion] === true;
        check.disabled = false;
    });

    actualizarEstadoTodasFilasPermisosConfig();
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

    const permisos = obtenerPermisosDetalladosDesdeMatrizConfig();

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
   PERMISOS DETALLADOS - REGLAS
========================= */

function accionesDisponiblesModuloConfig(modulo) {
    const reglas = {
        "dashboard": ["ver"],

        "monitoreo": ["ver", "crear", "editar", "eliminar", "exportar"],

        "productos": ["ver", "crear", "editar", "eliminar", "exportar"],

        "documentacion": ["ver", "exportar"],

        "flujo-proceso": ["ver", "crear", "editar", "eliminar", "exportar"],

        "estados": ["ver", "editar", "exportar"],

        "perfil": ["ver", "editar"],

        "configuracion": ["ver", "crear", "editar", "eliminar", "exportar"]
    };

    return reglas[modulo] || ["ver"];
}

function accionDisponiblePermisosConfig(modulo, accion) {
    return accionesDisponiblesModuloConfig(modulo).includes(accion);
}

/* =========================
   OBTENER PERMISOS DESDE MATRIZ
========================= */

function obtenerPermisosDetalladosDesdeMatrizConfig() {
    const modulos = [
        "dashboard",
        "monitoreo",
        "productos",
        "documentacion",
        "flujo-proceso",
        "estados",
        "perfil",
        "configuracion"
    ];

    const acciones = [
        "ver",
        "crear",
        "editar",
        "eliminar",
        "exportar"
    ];

    const permisos = {};

    modulos.forEach(modulo => {
        permisos[modulo] = {};

        acciones.forEach(accion => {
            const check = document.querySelector(
                `.config-permission-row input[data-modulo="${modulo}"][data-accion="${accion}"]`
            );

            if (!check) {
                permisos[modulo][accion] = false;
                return;
            }

            if (!accionDisponiblePermisosConfig(modulo, accion)) {
                permisos[modulo][accion] = false;
                return;
            }

            permisos[modulo][accion] = check.checked === true;
        });

        /*
            Si no puede ver el módulo, tampoco puede ejecutar acciones internas.
        */
        if (!permisos[modulo].ver) {
            permisos[modulo].crear = false;
            permisos[modulo].editar = false;
            permisos[modulo].eliminar = false;
            permisos[modulo].exportar = false;
        }
    });

    /*
        Perfil siempre visible para el usuario logueado.
    */
    permisos["perfil"].ver = true;

    return permisos;
}

/* =========================
   ESTADO VISUAL DE FILAS
========================= */

function actualizarEstadoTodasFilasPermisosConfig() {
    document.querySelectorAll(".config-permission-row").forEach(row => {
        actualizarEstadoFilaPermisosConfig(row.dataset.modulo);
    });
}

function actualizarEstadoFilaPermisosConfig(modulo) {
    if (!modulo) return;

    if (configUsuarioSeleccionado && configUsuarioSeleccionado.rol === "admin") {
        return;
    }

    const checkVer = document.querySelector(
        `.config-permission-row input[data-modulo="${modulo}"][data-accion="ver"]`
    );

    const puedeVer = checkVer ? checkVer.checked === true : false;

    const checksAcciones = document.querySelectorAll(
        `.config-permission-row input[data-modulo="${modulo}"]`
    );

    checksAcciones.forEach(check => {
        const accion = check.dataset.accion;

        if (!accion) return;

        const accionDisponible = accionDisponiblePermisosConfig(modulo, accion);

        if (!accionDisponible) {
            check.checked = false;
            check.disabled = true;
            return;
        }

        if (modulo === "perfil" && accion === "ver") {
            check.checked = true;
            check.disabled = true;
            return;
        }

        if (accion !== "ver" && !puedeVer) {
            check.checked = false;
            check.disabled = true;
            return;
        }

        check.disabled = false;
    });
}

/* =========================
   ENFOCAR PANEL PERMISOS
========================= */

function enfocarPanelPermisosConfig() {
    const usuarioSeleccionado = document.getElementById("configUsuarioSeleccionado");

    if (!usuarioSeleccionado) return;

    const panelPermisos = usuarioSeleccionado.closest(".config-admin-card");

    if (!panelPermisos) return;

    activarTabConfiguracion("permisos");

    panelPermisos.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest"
    });

    panelPermisos.classList.add("config-permisos-focus");

    setTimeout(() => {
        panelPermisos.classList.remove("config-permisos-focus");
    }, 1300);
}

function activarTabConfiguracion(tabNombre) {
    if (!tabNombre) return;

    document.querySelectorAll(".config-admin-tab").forEach(tab => {
        tab.classList.remove("active");

        if (tab.dataset.configTab === tabNombre) {
            tab.classList.add("active");
        }
    });

    document.querySelectorAll(".config-tab-panel").forEach(panel => {
        panel.classList.remove("active");

        if (panel.dataset.configPanel === tabNombre) {
            panel.classList.add("active");
        }
    });
}
