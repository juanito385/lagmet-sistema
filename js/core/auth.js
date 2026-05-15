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

        const data = JSON.parse(text);

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
    const user = JSON.parse(localStorage.getItem("user"));

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

    const userTexto = document.getElementById("user");

    if (userTexto) {
        userTexto.textContent = "Hola " + user.nombre + " 👋";
    }

    if (cargarDashboard && typeof showSection === "function") {
        setTimeout(() => {
            showSection("dashboard");
        }, 100);
    }

    console.log("APP INICIADA:", {
        login: login ? getComputedStyle(login).display : "no existe",
        app: app ? getComputedStyle(app).display : "no existe",
        contenido: contenido ? contenido.innerHTML.length : "no existe"
    });
}

/* ===============================
   MANTENER SESIÓN AL RECARGAR
================================ */
document.addEventListener("DOMContentLoaded", () => {
    const user = localStorage.getItem("user");

    if (user) {
        iniciarApp(true);
    }
});



/* ===============================
   LOGOUT
================================ */
function logout() {
    localStorage.removeItem("user");
    location.reload();
}