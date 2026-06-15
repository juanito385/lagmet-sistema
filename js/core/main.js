window.addEventListener("DOMContentLoaded", () => {
    /*
        IMPORTANTE:
        El inicio real de IRONIX lo controla login-loader.js,
        porque ese archivo valida la sesión PHP real usando:

        php/auth/verificar_sesion.php

        Este archivo ya no debe iniciar la app usando solo localStorage.
    */
    console.log("main.js cargado. Inicio de app controlado por login-loader.js");
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