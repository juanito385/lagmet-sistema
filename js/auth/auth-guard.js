/* ===============================
   IRONIX - AUTH GUARD FRONTEND
================================ */

/*
    Este archivo protege visualmente el sistema desde el frontend.

    IMPORTANTE:
    Esto NO reemplaza el guard PHP.
    El guard real de seguridad será php/auth/guard.php.
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
   VALIDAR SI HAY SESIÓN LOCAL
================================ */

function existeSesionLocalIronix() {
    const usuario = obtenerUsuarioIronix();

    return usuario !== null && usuario.id;
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
   PROTEGER APP
================================ */

function protegerAppIronix() {
    const usuario = obtenerUsuarioIronix();

    if (!usuario || !usuario.id) {
        console.warn("Acceso bloqueado: usuario no autenticado");

        localStorage.removeItem("user");

        if (typeof mostrarAuthIronix === "function") {
            mostrarAuthIronix();
        }

        return false;
    }

    return true;
}


/* ===============================
   PROTEGER SECCIÓN POR ROL
================================ */

function protegerRolIronix(rolesPermitidos = []) {
    const usuario = obtenerUsuarioIronix();

    if (!usuario || !usuario.id) {
        console.warn("Acceso bloqueado: usuario no autenticado");

        localStorage.removeItem("user");

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
    try {
        await fetch("php/auth/logout.php", {
            method: "POST"
        });
    } catch (error) {
        console.error("Error cerrando sesión en servidor:", error);
    }

    localStorage.removeItem("user");

    if (typeof mostrarAuthIronix === "function") {
        mostrarAuthIronix();
    } else {
        location.reload();
    }
}