window.addEventListener("DOMContentLoaded", async () => {

    iniciarApp();

    // Cargar dashboard inicial
    await showSection("dashboard");

});

/* =========================
   MENU USUARIO SIDEBAR
========================= */

const sidebarUser = document.querySelector(".sidebar-user");
const sidebarUserBtn = document.querySelector(".sidebar-user-btn");

if (sidebarUser && sidebarUserBtn) {

    sidebarUserBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        sidebarUser.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {

        if (!sidebarUser.contains(e.target)) {
            sidebarUser.classList.remove("active");
        }

    });

}