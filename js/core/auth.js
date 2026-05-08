/* LOGIN */
async function login() {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();
    const error = document.getElementById("error");

    error.textContent = "";

    if (!email || !pass) {
        error.textContent = "Completa correo y contraseña";
        return;
    }

    try {
        console.log("Enviando login...");

        const response = await fetch("php/login.php", {
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
        console.log("Respuesta login.php:", text);

        const data = JSON.parse(text);

        if (data.success) {
            localStorage.setItem("user", JSON.stringify(data.user));
            iniciarApp();

            if (typeof showSection === "function") {
                showSection("dashboard");
            }

        } else {
            error.textContent = data.message || "Datos incorrectos";
        }

    } catch (err) {
        console.error("Error login:", err);
        error.textContent = "Error al conectar con el servidor";
    }
}

/* INICIAR */
function iniciarApp() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        document.getElementById("login").style.display = "none";
        document.getElementById("app").style.display = "block";

        const userTexto = document.getElementById("user");

        if (userTexto) {
            userTexto.textContent = "Hola " + user.nombre + " 👋";
        }
    }
}

/* LOGOUT */
function logout() {
    localStorage.removeItem("user");
    location.reload();
}