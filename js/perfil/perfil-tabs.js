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