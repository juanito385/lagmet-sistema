/* =========================
   OBTENER USUARIO ACTUAL
========================= */

function obtenerUsuarioConfiguracion() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        console.error("Error leyendo usuario desde localStorage:", error);
        return null;
    }
}

/* =========================
   VALIDAR ADMIN
========================= */

function usuarioActualEsAdminConfig() {
    const user = obtenerUsuarioConfiguracion();
    return user && user.rol === "admin";
}

/* =========================
   HELPERS
========================= */

function actualizarTextoConfig(id, texto) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto;
    }
}

function obtenerValorConfig(id) {
    const elemento = document.getElementById(id);

    if (!elemento) return "";

    return elemento.value.trim();
}

function asignarValorConfig(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.value = valor;
    }
}

function obtenerInicialUsuarioConfig(nombre) {
    if (!nombre) return "U";

    return nombre.trim().charAt(0).toUpperCase();
}

function obtenerClaseEstadoConfig(estado) {
    if (estado === "activa") return "active";
    if (estado === "inactiva") return "inactive";
    if (estado === "bloqueada") return "blocked";

    return "inactive";
}

function formatearEstadoUsuarioConfig(estado) {
    if (estado === "activa") return "Activa";
    if (estado === "inactiva") return "Inactiva";
    if (estado === "bloqueada") return "Bloqueada";

    return "Sin estado";
}

function validarCorreoConfig(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function escaparHTMLConfig(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
