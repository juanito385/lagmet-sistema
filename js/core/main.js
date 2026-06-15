/* ==================================================
   IRONIX - MAIN NEUTRAL

   Responsabilidad actual:
   - No iniciar la app.
   - No cargar Dashboard.
   - No depender de localStorage.
   - Dejar que login-loader.js controle el inicio real.

   IMPORTANTE:
   Este archivo se mantiene neutral para evitar doble carga
   de la app o del Dashboard.
================================================== */

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