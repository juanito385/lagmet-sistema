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


