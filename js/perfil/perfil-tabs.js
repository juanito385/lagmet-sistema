/* =========================
   PERFIL - CONTROL GENERAL
========================= */

let perfilInicializado = false;


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

    tabs.forEach(item => {
        item.classList.remove("active");
    });

    panels.forEach(panel => {
        panel.classList.remove("active");
    });

    tab.classList.add("active");

    const panelActivo = perfilSection.querySelector(
        `.perfil-tab-panel[data-perfil-panel="${tabSeleccionado}"]`
    );

    if (panelActivo) {
        panelActivo.classList.add("active");
    }
});


/* =========================
   PERFIL - BOTÓN CAMBIAR CONTRASEÑA
========================= */

document.addEventListener("click", function (e) {
    const btn = e.target.closest("#btnCambiarPasswordPerfil");

    if (!btn) return;

    cambiarPasswordPerfil();
});


/* =========================
   PERFIL - INICIALIZAR
========================= */

function inicializarPerfilUsuario() {
    const perfilSection = document.querySelector(".perfil-section");

    if (!perfilSection) return;

    /*
        Evita inicializar el mismo perfil muchas veces.
    */
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

    if (!user) return;

    actualizarTextoPerfil("perfilNombre", user.nombre || "Usuario");
    actualizarTextoPerfil("perfilCorreo", user.email || "Sin correo");
    actualizarTextoPerfil("perfilRol", formatearRolPerfil(user.rol));
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

function actualizarTextoPerfil(id, texto) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto;
    }
}

function formatearRolPerfil(rol) {
    if (rol === "admin") return "Administrador";
    if (rol === "usuario") return "Usuario";

    return "Usuario";
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