/* =========================
   PERFIL - CONTROL GENERAL
========================= */

let perfilDatosActuales = null;


/* =========================
   PERFIL - TABS INTERNOS
========================= */

document.addEventListener("click", function (e) {
    const tab = e.target.closest(".perfil-tab");

    if (!tab) return;

    const perfilSection = tab.closest(".perfil-section");

    if (!perfilSection) return;

    const tabSeleccionado = tab.dataset.perfilTab;

    const tabs = perfilSection.querySelectorAll(".perfil-tab");
    const panels = perfilSection.querySelectorAll(".perfil-tab-panel");

    tabs.forEach(item => item.classList.remove("active"));
    panels.forEach(panel => panel.classList.remove("active"));

    tab.classList.add("active");

    const panelActivo = perfilSection.querySelector(
        `.perfil-tab-panel[data-perfil-panel="${tabSeleccionado}"]`
    );

    if (panelActivo) {
        panelActivo.classList.add("active");
    }
});


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


/* =========================
   PERFIL - INICIALIZAR
========================= */

function inicializarPerfilUsuario() {
    const perfilSection = document.querySelector(".perfil-section");

    if (!perfilSection) return;

    if (perfilSection.dataset.inicializado === "true") return;

    perfilSection.dataset.inicializado = "true";

    cargarDatosPerfilUsuario();

    console.log("Perfil inicializado correctamente");
}


/* =========================
   PERFIL - CARGAR DATOS USUARIO
========================= */

function cargarDatosPerfilUsuario() {
    const user = obtenerUsuarioPerfil();

    if (!user || !user.id) return;

    fetch(`php/config/obtener_usuario.php?usuario_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
            console.log("Datos perfil:", data);

            if (!data.success || !data.usuario) {
                console.warn(data.message || "No se pudo cargar perfil");
                return;
            }

            perfilDatosActuales = normalizarUsuarioPerfil(data.usuario);

            actualizarLocalStoragePerfil(perfilDatosActuales);
            pintarDatosPerfil(perfilDatosActuales);

            if (typeof actualizarUsuarioSidebar === "function") {
                actualizarUsuarioSidebar();
            }
        })
        .catch(err => {
            console.error("Error al cargar datos del perfil:", err);

            /*
                Fallback: si falla el PHP, mostramos lo que esté en localStorage.
            */
            const usuarioLocal = normalizarUsuarioPerfil(user);
            perfilDatosActuales = usuarioLocal;
            pintarDatosPerfil(usuarioLocal);
        });
}


/* =========================
   PERFIL - PINTAR DATOS
========================= */

function pintarDatosPerfil(user) {
    if (!user) return;

    actualizarTextoPerfil("perfilNombre", user.nombre || "Usuario");
    actualizarTextoPerfil("perfilCorreo", user.email || "Sin correo");
    actualizarTextoPerfil("perfilRol", formatearRolPerfil(user.rol));

    actualizarTextoPerfil("perfilTelefono", user.telefono || "Sin registrar");
    actualizarTextoPerfil("perfilArea", user.area || "Producción");
    actualizarTextoPerfil("perfilIdioma", user.idioma || "Español / Chile");

    const fechaRegistro = formatearFechaPerfil(user.fecha_creacion);
    actualizarHTMLPerfil("perfilFechaRegistro", `
        <span class="material-symbols-outlined">calendar_month</span>
        ${fechaRegistro}
    `);

    const estado = formatearEstadoPerfil(user.estado);
    actualizarTextoPerfil("perfilEstadoCuenta", estado.texto);

    const estadoElemento = document.getElementById("perfilEstadoCuenta");
    if (estadoElemento) {
        estadoElemento.className = "perfil-estado-activo";
        estadoElemento.textContent = estado.texto;
    }
}


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


/* =========================
   HELPERS PERFIL
========================= */

function obtenerUsuarioPerfil() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        console.error("Error leyendo usuario para perfil:", error);
        return null;
    }
}

function actualizarLocalStoragePerfil(user) {
    if (!user) return;

    const usuarioActual = obtenerUsuarioPerfil() || {};

    const actualizado = {
        ...usuarioActual,
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono,
        area: user.area,
        idioma: user.idioma,
        estado: user.estado,
        fecha_creacion: user.fecha_creacion
    };

    localStorage.setItem("user", JSON.stringify(actualizado));
}

function normalizarUsuarioPerfil(user) {
    return {
        id: user.id,
        nombre: user.nombre || "Usuario",
        email: user.email || user.correo || "",
        rol: user.rol || "usuario",
        telefono: user.telefono || "",
        area: user.area || "Producción",
        idioma: user.idioma || "Español / Chile",
        estado: user.estado || "activa",
        fecha_creacion: user.fecha_creacion || ""
    };
}

function actualizarTextoPerfil(id, texto) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto;
    }
}

function actualizarHTMLPerfil(id, html) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.innerHTML = html;
    }
}

function formatearRolPerfil(rol) {
    if (rol === "admin") return "Administrador";
    if (rol === "usuario") return "Usuario";

    return "Usuario";
}

function formatearEstadoPerfil(estado) {
    if (estado === "activa") {
        return {
            texto: "Activa",
            clase: "activa"
        };
    }

    if (estado === "inactiva") {
        return {
            texto: "Inactiva",
            clase: "inactiva"
        };
    }

    if (estado === "bloqueada") {
        return {
            texto: "Bloqueada",
            clase: "bloqueada"
        };
    }

    return {
        texto: "Activa",
        clase: "activa"
    };
}

function formatearFechaPerfil(fecha) {
    if (!fecha) return "Sin fecha";

    const partes = fecha.split(" ")[0]?.split("-");

    if (!partes || partes.length !== 3) return fecha;

    const [anio, mes, dia] = partes;

    return `${dia}/${mes}/${anio}`;
}

function validarCorreoPerfil(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}


/* =========================
   DETECTAR CARGA DEL PERFIL
   SIN CONGELAR LA APP
========================= */

document.addEventListener("DOMContentLoaded", function () {
    const contenido = document.getElementById("contenido");

    if (!contenido) return;

    const observerPerfil = new MutationObserver(function () {
        const perfilSection = document.querySelector(".perfil-section");

        if (!perfilSection) return;

        inicializarPerfilUsuario();
    });

    observerPerfil.observe(contenido, {
        childList: true
    });
});