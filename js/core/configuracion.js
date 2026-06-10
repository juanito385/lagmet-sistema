console.log("CONFIGURACION.JS CARGADO");

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
   CARGAR USUARIO
========================= */
function cargarUsuario() {
    const nombre = document.getElementById("configNombre");
    const correo = document.getElementById("configCorreo");
    const rol = document.getElementById("configRol");

    /*
        Si la vista Configuración todavía no está cargada,
        no hacemos nada. La función se volverá a llamar
        cuando la vista aparezca en pantalla.
    */
    if (!nombre || !correo || !rol) {
        return;
    }

    const user = obtenerUsuarioConfiguracion();

    if (!user || !user.id) {
        console.warn("No hay usuario logueado para cargar configuración");
        return;
    }

    fetch(`php/config/obtener_usuario.php?usuario_id=${user.id}`)
        .then(res => res.json())
        .then(data => {
            console.log("Usuario configuración:", data);

            if (data.success && data.usuario) {
                nombre.value = data.usuario.nombre || "";
                correo.value = data.usuario.correo || "";
                rol.value = data.usuario.rol || "";
            } else {
                console.warn(data.message || "No se pudo cargar el usuario");
            }
        })
        .catch(err => console.error("Error al cargar usuario:", err));
}

/* =========================
   GUARDAR CONFIGURACIÓN
========================= */
function guardarConfiguracion() {
    const nombreInput = document.getElementById("configNombre");
    const correoInput = document.getElementById("configCorreo");

    if (!nombreInput || !correoInput) {
        alert("No se encontraron los campos de configuración");
        return;
    }

    const user = obtenerUsuarioConfiguracion();

    if (!user || !user.id) {
        alert("No hay usuario logueado");
        return;
    }

    const nombre = nombreInput.value.trim();
    const correo = correoInput.value.trim();

    const formData = new FormData();
    formData.append("usuario_id", user.id);
    formData.append("nombre", nombre);
    formData.append("correo", correo);

    fetch("php/config/actualizar_usuario.php", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.message || "Datos actualizados correctamente");

            const usuarioActualizado = {
                ...user,
                nombre: nombre,
                email: correo
            };

            localStorage.setItem("user", JSON.stringify(usuarioActualizado));

            if (typeof actualizarUsuarioSidebar === "function") {
                actualizarUsuarioSidebar();
            }

            cargarUsuario();
        } else {
            alert(data.message || "Error al actualizar");
        }
    })
    .catch(err => {
        console.error("Error al guardar configuración:", err);
        alert("Error al guardar configuración");
    });
}

/* =========================
   CAMBIAR CONTRASEÑA CONFIGURACIÓN
========================= */
function cambiarPasswordConfiguracion() {
    const passwordActual = document.getElementById("passwordActual");
    const passwordNueva = document.getElementById("passwordNueva");
    const passwordConfirmar = document.getElementById("passwordConfirmar");

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
        alert("No se encontraron los campos de contraseña");
        return;
    }

    const user = obtenerUsuarioConfiguracion();

    if (!user || !user.id) {
        alert("No hay usuario logueado");
        return;
    }

    const formData = new FormData();
    formData.append("usuario_id", user.id);
    formData.append("actual", passwordActual.value);
    formData.append("nueva", passwordNueva.value);
    formData.append("confirmar", passwordConfirmar.value);

    fetch("php/config/cambiar_password.php", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);

        if (data.success) {
            passwordActual.value = "";
            passwordNueva.value = "";
            passwordConfirmar.value = "";
        }
    })
    .catch(err => {
        console.error("Error al cambiar contraseña:", err);
        alert("Error al cambiar contraseña");
    });
}

/* =========================
   EVENTOS DE BOTONES Y OJITO
========================= */
document.addEventListener("click", function(e) {

    const btn = e.target.closest("button");

    if (btn) {
        console.log("Botón presionado:", btn.id);

        if (btn.id === "btnGuardarConfig") {
            guardarConfiguracion();
            return;
        }

        if (btn.id === "btnCambiarPassword") {
            console.log("Llamando cambiarPasswordConfiguracion...");
            cambiarPasswordConfiguracion();
            return;
        }
    }

    if (e.target.classList.contains("toggle-password")) {
        const input = document.getElementById(e.target.dataset.target);

        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
            e.target.textContent = "visibility_off";
            e.target.classList.add("activo");
        } else {
            input.type = "password";
            e.target.textContent = "visibility";
            e.target.classList.remove("activo");
        }
    }
});

/* =========================
   HACER FUNCIONES GLOBALES
========================= */
window.guardarConfiguracion = guardarConfiguracion;
window.cambiarPasswordConfiguracion = cambiarPasswordConfiguracion;
window.cargarUsuario = cargarUsuario;

/* =========================
   DETECTAR CUANDO SE CARGA CONFIGURACIÓN
========================= */
const observerConfiguracion = new MutationObserver(() => {
    const configNombre = document.getElementById("configNombre");

    if (configNombre) {
        cargarUsuario();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const contenido = document.getElementById("contenido");

    if (contenido) {
        observerConfiguracion.observe(contenido, {
            childList: true
        });
    }
});