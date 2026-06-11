/* =========================
   HELPERS PERFIL
========================= */

function obtenerUsuarioPerfil() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        console.error("Error leyendo usuario para perfil:", error);
        return null;
    }
}

function actualizarLocalStoragePerfil(user) {
    if (!user) return;

    const usuarioActual = obtenerUsuarioPerfil() || {};

    const actualizado = {
        ...usuarioActual,
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono,
        area: user.area,
        idioma: user.idioma,
        estado: user.estado,
        fecha_creacion: user.fecha_creacion
    };

    localStorage.setItem("user", JSON.stringify(actualizado));
}

function normalizarUsuarioPerfil(user) {
    return {
        id: user.id,
        nombre: user.nombre || "Usuario",
        email: user.email || user.correo || "",
        rol: user.rol || "usuario",
        telefono: user.telefono || "",
        area: user.area || "Producción",
        idioma: user.idioma || "Español / Chile",
        estado: user.estado || "activa",
        fecha_creacion: user.fecha_creacion || ""
    };
}

function actualizarTextoPerfil(id, texto) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto;
    }
}

function actualizarHTMLPerfil(id, html) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.innerHTML = html;
    }
}

function formatearRolPerfil(rol) {
    if (rol === "admin") return "Administrador";
    if (rol === "usuario") return "Usuario";

    return "Usuario";
}

function formatearEstadoPerfil(estado) {
    if (estado === "activa") {
        return {
            texto: "Activa",
            clase: "activa"
        };
    }

    if (estado === "inactiva") {
        return {
            texto: "Inactiva",
            clase: "inactiva"
        };
    }

    if (estado === "bloqueada") {
        return {
            texto: "Bloqueada",
            clase: "bloqueada"
        };
    }

    return {
        texto: "Activa",
        clase: "activa"
    };
}

function formatearFechaPerfil(fecha) {
    if (!fecha) return "Sin fecha";

    const partes = fecha.split(" ")[0]?.split("-");

    if (!partes || partes.length !== 3) return fecha;

    const [anio, mes, dia] = partes;

    return `${dia}/${mes}/${anio}`;
}

function validarCorreoPerfil(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}
