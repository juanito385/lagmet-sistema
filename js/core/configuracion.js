console.log("CONFIGURACION.JS CARGADO");
 
/* =========================
   CARGAR USUARIO
========================= */
function cargarUsuario() {
    const nombre = document.getElementById("configNombre");
    const correo = document.getElementById("configCorreo");
    const rol = document.getElementById("configRol");

    if (!nombre || !correo || !rol) {
        setTimeout(cargarUsuario, 300);
        return;
    }

    fetch("php/config/obtener_usuario.php")
        .then(res => res.json())
        .then(data => {
            if (data.success && data.usuario) {
                nombre.value = data.usuario.nombre;
                correo.value = data.usuario.correo;
                rol.value = data.usuario.rol;
            }
        })
        .catch(err => console.error("Error al cargar usuario:", err));
}

/* =========================
   GUARDAR CONFIGURACIÓN
========================= */
function guardarConfiguracion() {
    const nombre = document.getElementById("configNombre").value;
    const correo = document.getElementById("configCorreo").value;

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("correo", correo);

    fetch("php/config/actualizar_usuario.php", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Datos actualizados correctamente");
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

    const formData = new FormData();
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

/* =========================
   INICIAR
========================= */
cargarUsuario();