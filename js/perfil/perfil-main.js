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

window.inicializarPerfilUsuario = inicializarPerfilUsuario;
