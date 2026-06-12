/* ==================================================
   SIDEBAR - CONTROL GENERAL
   Ruta: js/sidebar/sidebar.js
================================================== */

/* =========================
   COLAPSAR / EXPANDIR SIDEBAR
========================= */

function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");

    if (!sidebar) {
        console.warn("Sidebar no encontrada en el DOM.");
        return;
    }

    sidebar.classList.toggle("collapsed");
}


/* =========================
   MENÚ USUARIO SIDEBAR
   Funciona aunque el sidebar sea cargado dinámicamente
========================= */

document.addEventListener("click", function (e) {
    const botonUsuario = e.target.closest(".sidebar-user-btn");

    if (botonUsuario) {
        const sidebarUser = botonUsuario.closest(".sidebar-user");

        if (!sidebarUser) return;

        sidebarUser.classList.toggle("active");
        sidebarUser.classList.toggle("open");

        return;
    }

    const clickDentroMenuUsuario = e.target.closest(".sidebar-user");

    if (!clickDentroMenuUsuario) {
        document.querySelectorAll(".sidebar-user.active, .sidebar-user.open")
            .forEach(item => {
                item.classList.remove("active");
                item.classList.remove("open");
            });
    }
});