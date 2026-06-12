/* ==================================================
   SIDEBAR - CONTROL GENERAL
   Ruta: js/sidebar/sidebar.js
================================================== */

function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");

    if (!sidebar) {
        console.warn("Sidebar no encontrada en el DOM.");
        return;
    }

    sidebar.classList.toggle("collapsed");
}