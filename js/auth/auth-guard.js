/* ===============================
   IRONIX - AUTH GUARD FRONTEND
   ESTADO ACTUAL: INACTIVO

   IMPORTANTE:
   Este archivo NO está cargado actualmente en ironix-loader.js.

   El flujo activo de autenticación está repartido en:
   - js/auth/login-loader.js
   - js/core/auth.js
   - js/core/navigation.js

   No cargar este archivo todavía para evitar duplicidad de funciones como:
   - verificar sesión
   - mostrar app/login
   - cerrar sesión
   - limpiar localStorage

   Se conserva como referencia para una futura consolidación.
================================ */


/*
    Este archivo protege visualmente el sistema desde el frontend.

    IMPORTANTE:
    - localStorage NO es la fuente real de seguridad.
    - La sesión real se valida contra PHP usando:
      php/auth/verificar_sesion.php
*/


/* ===============================
   OBTENER USUARIO LOCAL
================================ */

function obtenerUsuarioIronix() {
    const user = localStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        console.error("Usuario local inválido:", error);
        localStorage.removeItem("user");
        return null;
    }
}


/* ===============================
   GUARDAR USUARIO LOCAL
================================ */

function guardarUsuarioIronix(usuario) {
    if (!usuario || !usuario.id) {
        localStorage.removeItem("user");
        return;
    }

    localStorage.setItem("user", JSON.stringify(usuario));
}


/* ===============================
   LIMPIAR SESIÓN LOCAL
================================ */

function limpiarSesionLocalIronix() {
    localStorage.removeItem("user");
}


/* ===============================
   VALIDAR SI HAY SESIÓN LOCAL
================================ */

function existeSesionLocalIronix() {
    const usuario = obtenerUsuarioIronix();

    return usuario !== null && usuario.id;
}


/* ===============================
   VALIDAR SESIÓN REAL EN PHP
================================ */

async function verificarSesionServidorIronix() {
    try {
        const respuesta = await fetch("php/auth/verificar_sesion.php", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.success || !datos.auth || !datos.user) {
            limpiarSesionLocalIronix();

            return {
                success: false,
                auth: false,
                message: datos.message || "Sesión no iniciada o expirada"
            };
        }

        guardarUsuarioIronix(datos.user);

        return {
            success: true,
            auth: true,
            user: datos.user,
            message: datos.message || "Sesión activa"
        };

    } catch (error) {
        console.error("Error verificando sesión en servidor:", error);

        limpiarSesionLocalIronix();

        return {
            success: false,
            auth: false,
            message: "No se pudo verificar la sesión en el servidor",
            error: error.message
        };
    }
}


/* ===============================
   VALIDAR ROL
================================ */

function usuarioTieneRolIronix(rolesPermitidos = []) {
    const usuario = obtenerUsuarioIronix();

    if (!usuario) {
        return false;
    }

    if (!Array.isArray(rolesPermitidos)) {
        rolesPermitidos = [rolesPermitidos];
    }

    return rolesPermitidos.includes(usuario.rol);
}


/* ===============================
   MOSTRAR APP
================================ */

function mostrarAppIronix() {
    const app = document.getElementById("app");
    const authContainer = document.getElementById("authContainer");

    if (authContainer) {
        authContainer.style.display = "none";
    }

    if (app) {
        app.style.display = "block";
    }
}


/* ===============================
   OCULTAR APP
================================ */

function ocultarAppIronix() {
    const app = document.getElementById("app");
    const authContainer = document.getElementById("authContainer");

    if (app) {
        app.style.display = "none";
    }

    if (authContainer) {
        authContainer.style.display = "block";
    }
}


/* ===============================
   PROTEGER APP - VALIDACIÓN LOCAL
   Mantiene compatibilidad con código antiguo
================================ */

function protegerAppIronix() {
    const usuario = obtenerUsuarioIronix();

    if (!usuario || !usuario.id) {
        console.warn("Acceso bloqueado: usuario no autenticado localmente");

        limpiarSesionLocalIronix();
        ocultarAppIronix();

        if (typeof mostrarAuthIronix === "function") {
            mostrarAuthIronix();
        }

        return false;
    }

    return true;
}


/* ===============================
   PROTEGER APP - VALIDACIÓN REAL PHP
================================ */

async function protegerAppServidorIronix() {
    const sesion = await verificarSesionServidorIronix();

    if (!sesion.success || !sesion.auth) {
        console.warn("Acceso bloqueado: sesión PHP inválida");

        limpiarSesionLocalIronix();
        ocultarAppIronix();

        if (typeof mostrarAuthIronix === "function") {
            mostrarAuthIronix();
        }

        return false;
    }

    mostrarAppIronix();

    return true;
}


/* ===============================
   PROTEGER SECCIÓN POR ROL
================================ */

function protegerRolIronix(rolesPermitidos = []) {
    const usuario = obtenerUsuarioIronix();

    if (!usuario || !usuario.id) {
        console.warn("Acceso bloqueado: usuario no autenticado");

        limpiarSesionLocalIronix();
        ocultarAppIronix();

        if (typeof mostrarAuthIronix === "function") {
            mostrarAuthIronix();
        }

        return false;
    }

    if (!Array.isArray(rolesPermitidos)) {
        rolesPermitidos = [rolesPermitidos];
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
        console.warn("Acceso bloqueado: rol no autorizado");

        alert("No tienes permisos para acceder a esta sección");

        return false;
    }

    return true;
}


/* ===============================
   CERRAR SESIÓN FRONTEND + BACKEND
================================ */

async function cerrarSesionIronix() {
    /*
        Bandera temporal:
        evita que otro módulo intente iniciar la app
        mientras se está cerrando sesión.
    */
    sessionStorage.setItem("ironix_logout_en_proceso", "1");

    localStorage.removeItem("user");

    try {
        await fetch("php/auth/logout.php", {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store"
        });

    } catch (error) {
        console.error("Error cerrando sesión en servidor:", error);
    }

    localStorage.removeItem("user");

    const app = document.getElementById("app");
    const authContainer = document.getElementById("authContainer");

    if (app) {
        app.style.display = "none";
    }

    if (authContainer) {
        authContainer.style.display = "block";
    }

    if (typeof mostrarAuthIronix === "function") {
        mostrarAuthIronix();
    }

    setTimeout(() => {
        sessionStorage.removeItem("ironix_logout_en_proceso");
    }, 500);
}

