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
    let user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        document.getElementById("login").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.getElementById("user").textContent = "Hola " + user.nombre;
    }
}

/* LOGOUT */
function logout() {
    localStorage.removeItem("user");
    location.reload();
}

function showSection(id) {
    document.querySelectorAll(".section")
        .forEach(s => s.classList.remove("active"));

    document.getElementById(id).classList.add("active");

    document.querySelectorAll(".menu button")
        .forEach(b => b.classList.remove("active"));

    const boton = document.querySelector(`.menu button[onclick="showSection('${id}')"]`);
    if (boton) boton.classList.add("active");

    if (id === "productos" && typeof renderProductos === "function") {
        renderProductos();
    }

    if (id === "documentacion" && typeof mostrarGantt === "function") {
        mostrarGantt();
    }
}