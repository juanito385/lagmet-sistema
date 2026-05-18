/* ===============================
   CARGAR AUTH IRONIX
================================ */

document.addEventListener("DOMContentLoaded", () => {
    cargarAuthIronix();
});

async function cargarAuthIronix() {
    const authContainer = document.getElementById("authContainer");

    if (!authContainer) {
        console.error("No existe #authContainer en inicio.html");
        return;
    }

    try {
        const [loginResponse, recuperarResponse] = await Promise.all([
            fetch("views/auth/login.html"),
            fetch("views/auth/recuperar.html")
        ]);

        if (!loginResponse.ok) {
            throw new Error("No se pudo cargar views/auth/login.html");
        }

        if (!recuperarResponse.ok) {
            throw new Error("No se pudo cargar views/auth/recuperar.html");
        }

        const loginHTML = await loginResponse.text();
        const recuperarHTML = await recuperarResponse.text();

        authContainer.innerHTML = loginHTML + recuperarHTML;

        console.log("Auth IRONIX cargado correctamente");

        const user = localStorage.getItem("user");

        if (user && typeof iniciarApp === "function") {
            iniciarApp(true);
        }

    } catch (error) {
        console.error("Error cargando Auth IRONIX:", error);

        authContainer.innerHTML = `
            <div style="color:white; padding:40px;">
                Error cargando Auth IRONIX
            </div>
        `;
    }
}