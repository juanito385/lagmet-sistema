/* ===============================
   CARGAR LOGIN IRONIX
================================ */

document.addEventListener("DOMContentLoaded", () => {
    cargarLoginIronix();
});

async function cargarLoginIronix() {
    const authContainer = document.getElementById("authContainer");

    if (!authContainer) {
        console.error("No existe #authContainer en inicio.html");
        return;
    }

    try {
        const response = await fetch("views/auth/login.html");

        if (!response.ok) {
            throw new Error("No se pudo cargar views/auth/login.html");
        }

        const html = await response.text();
        authContainer.innerHTML = html;

        console.log("Login IRONIX cargado correctamente");

        const user = localStorage.getItem("user");

        if (user && typeof iniciarApp === "function") {
            iniciarApp(true);
        }

    } catch (error) {
        console.error("Error cargando login IRONIX:", error);

        authContainer.innerHTML = `
            <div style="color:white; padding:40px;">
                Error cargando login IRONIX
            </div>
        `;
    }
}