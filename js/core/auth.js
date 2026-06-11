/* ===============================
   LOGIN
================================ */
async function login() {
    const email = document.getElementById("email")?.value.trim();
    const pass = document.getElementById("password")?.value.trim();
    const error = document.getElementById("error");

    if (error) error.textContent = "";

    if (!email || !pass) {
        if (error) error.textContent = "Completa correo y contraseña";
        return;
    }

    try {
        console.log("Enviando login...");

        const response = await fetch("php/auth/login.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: pass
            })
        });

        const text = await response.text();
        console.log("Respuesta auth/login.php:", text);

        let data;

        try {
            data = JSON.parse(text);
        } catch (jsonError) {
            console.error("Respuesta no válida desde login.php:", text);
            if (error) error.textContent = "Respuesta inválida del servidor";
            return;
        }

        if (data.success) {
            localStorage.setItem("user", JSON.stringify(data.user));

            iniciarApp(true);

        } else {
            if (error) error.textContent = data.message || "Datos incorrectos";
        }

    } catch (err) {
        console.error("Error login:", err);

        if (error) {
            error.textContent = "Error al conectar con el servidor";
        }
    }
}


/* ===============================
   INICIAR APP
================================ */
function iniciarApp(cargarDashboard = false) {
    const user = obtenerUsuarioActual();

    if (!user) return;

    const login = document.getElementById("login");
    const recuperar = document.getElementById("recuperar");
    const app = document.getElementById("app");
    const contenido = document.getElementById("contenido");

    document.body.classList.add("usuario-logueado");

    if (login) {
        login.style.setProperty("display", "none", "important");
        login.style.setProperty("visibility", "hidden", "important");
        login.style.setProperty("opacity", "0", "important");
        login.style.setProperty("pointer-events", "none", "important");
    }

    if (recuperar) {
        recuperar.style.setProperty("display", "none", "important");
        recuperar.style.setProperty("visibility", "hidden", "important");
        recuperar.style.setProperty("opacity", "0", "important");
        recuperar.style.setProperty("pointer-events", "none", "important");
    }

    if (app) {
        app.style.setProperty("display", "block", "important");
        app.style.setProperty("visibility", "visible", "important");
        app.style.setProperty("opacity", "1", "important");
    }

    if (contenido) {
        contenido.style.setProperty("display", "block", "important");
        contenido.style.setProperty("visibility", "visible", "important");
        contenido.style.setProperty("opacity", "1", "important");
    }

    actualizarUsuarioSidebar();

    if (typeof aplicarPermisosNavegacion === "function") {
        aplicarPermisosNavegacion();
    }

    const userTexto = document.getElementById("user");

    if (userTexto) {
        userTexto.textContent = "Hola " + (user.nombre || "Usuario") + " 👋";
    }

    if (cargarDashboard && typeof showSection === "function") {
        setTimeout(() => {
            showSection("dashboard");
        }, 100);
    }

    console.log("APP INICIADA:", {
        usuario: user.nombre,
        rol: user.rol,
        login: login ? getComputedStyle(login).display : "no existe",
        app: app ? getComputedStyle(app).display : "no existe",
        contenido: contenido ? contenido.innerHTML.length : "no existe"
    });
}


/* ===============================
   OBTENER USUARIO ACTUAL
================================ */
function obtenerUsuarioActual() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        console.error("Error leyendo usuario desde localStorage:", error);
        localStorage.removeItem("user");
        return null;
    }
}


/* ===============================
   ACTUALIZAR USUARIO SIDEBAR
================================ */
function actualizarUsuarioSidebar() {
    const user = obtenerUsuarioActual();

    if (!user) return;

    const avatar = document.getElementById("sidebarUserAvatar");
    const nombre = document.getElementById("sidebarUserNombre");
    const rol = document.getElementById("sidebarUserRol");

    if (avatar) {
        avatar.textContent = obtenerInicialesUsuario(user.nombre, user.rol);
    }

    if (nombre) {
        nombre.textContent = user.nombre || "Usuario";
    }

    if (rol) {
        rol.textContent = formatearRolUsuario(user.rol);
    }
}


/* ===============================
   INICIALES USUARIO
================================ */
function obtenerInicialesUsuario(nombre, rol) {
    if (rol === "admin") return "ADM";

    if (!nombre) return "USR";

    const partes = nombre.trim().split(" ").filter(Boolean);

    if (partes.length === 0) return "USR";

    if (partes.length === 1) {
        return partes[0].substring(0, 3).toUpperCase();
    }

    return (partes[0][0] + partes[1][0]).toUpperCase();
}


/* ===============================
   FORMATEAR ROL
================================ */
function formatearRolUsuario(rol) {
    if (rol === "admin") return "Administrador";
    if (rol === "usuario") return "Usuario";

    return "Usuario";
}


/* ===============================
   VALIDAR ROL
================================ */
function usuarioEsAdmin() {
    const user = obtenerUsuarioActual();

    return user && user.rol === "admin";
}

function usuarioEsNormal() {
    const user = obtenerUsuarioActual();

    return user && user.rol === "usuario";
}


/* ===============================
   LOGOUT
================================ */
function logout() {
    localStorage.removeItem("user");
    document.body.classList.remove("usuario-logueado");
    location.reload();
}