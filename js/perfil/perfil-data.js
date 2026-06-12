/* =========================
   PERFIL - CARGAR DATOS USUARIO
========================= */

function cargarDatosPerfilUsuario() {
    const user = obtenerUsuarioPerfil();

    if (!user || !user.id) return;

    fetch(`php/perfil/obtener_usuario.php?usuario_id=${encodeURIComponent(user.id)}`)
        .then(res => res.json())
        .then(data => {
            console.log("Datos perfil:", data);

            if (!data.success || !data.usuario) {
                console.warn(data.message || "No se pudo cargar perfil");
                return;
            }

            perfilDatosActuales = normalizarUsuarioPerfil(data.usuario);

            actualizarLocalStoragePerfil(perfilDatosActuales);
            pintarDatosPerfil(perfilDatosActuales);

            if (typeof actualizarUsuarioSidebar === "function") {
                actualizarUsuarioSidebar();
            }
        })
        .catch(err => {
            console.error("Error al cargar datos del perfil:", err);

            /*
                Fallback: si falla el PHP, mostramos lo que esté en localStorage.
            */
            const usuarioLocal = normalizarUsuarioPerfil(user);
            perfilDatosActuales = usuarioLocal;
            pintarDatosPerfil(usuarioLocal);
        });
}