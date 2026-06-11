/* =========================
   PERFIL - PINTAR DATOS
========================= */

function pintarDatosPerfil(user) {
    if (!user) return;

    actualizarTextoPerfil("perfilNombre", user.nombre || "Usuario");
    actualizarTextoPerfil("perfilCorreo", user.email || "Sin correo");
    actualizarTextoPerfil("perfilRol", formatearRolPerfil(user.rol));

    actualizarTextoPerfil("perfilTelefono", user.telefono || "Sin registrar");
    actualizarTextoPerfil("perfilArea", user.area || "Producción");
    actualizarTextoPerfil("perfilIdioma", user.idioma || "Español / Chile");

    const fechaRegistro = formatearFechaPerfil(user.fecha_creacion);
    actualizarHTMLPerfil("perfilFechaRegistro", `
        <span class="material-symbols-outlined">calendar_month</span>
        ${fechaRegistro}
    `);

    const estado = formatearEstadoPerfil(user.estado);
    actualizarTextoPerfil("perfilEstadoCuenta", estado.texto);

    const estadoElemento = document.getElementById("perfilEstadoCuenta");
    if (estadoElemento) {
        estadoElemento.className = "perfil-estado-activo";
        estadoElemento.textContent = estado.texto;
    }
}
