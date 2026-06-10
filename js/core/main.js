window.addEventListener("DOMContentLoaded", async () => {

    /*
        Validamos si existe usuario logueado.
        Esto evita cargar Dashboard cuando todavía está visible el login.
    */
    const user = typeof obtenerUsuarioActual === "function"
        ? obtenerUsuarioActual()
        : JSON.parse(localStorage.getItem("user"));

    if (!user) {
        console.log("Sin usuario logueado. Esperando login...");
        return;
    }

    iniciarApp();

    /*
        Cargar dashboard inicial solo si existe showSection.
    */
    if (typeof showSection === "function") {
        await showSection("dashboard");
    }

});


/* =========================
   MENU USUARIO SIDEBAR
========================= */

const sidebarUser = document.querySelector(".sidebar-user");
const sidebarUserBtn = document.querySelector(".sidebar-user-btn");
const sidebarUserMenu = document.querySelector(".sidebar-user-menu");

if (sidebarUser && sidebarUserBtn) {

    sidebarUserBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        sidebarUser.classList.toggle("active");
    });

    /*
        Evita que el menú se cierre al hacer click dentro,
        pero permite que los botones internos funcionen.
    */
    if (sidebarUserMenu) {
        sidebarUserMenu.addEventListener("click", (e) => {
            e.stopPropagation();

            /*
                Si se presiona una opción del menú, cerramos el dropdown.
                Ejemplo: Ver perfil, Configuración o Cerrar sesión.
            */
            const boton = e.target.closest("button");

            if (boton) {
                sidebarUser.classList.remove("active");
            }
        });
    }

    /*
        Cerrar menú al hacer click fuera.
    */
    document.addEventListener("click", (e) => {

        if (!sidebarUser.contains(e.target)) {
            sidebarUser.classList.remove("active");
        }

    });

}