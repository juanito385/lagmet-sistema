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

        configurarEnterAuthIronix();

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


/* ===============================
   AUTH IRONIX - ENTER KEY
================================ */

let enterAuthIronixConfigurado = false;

function configurarEnterAuthIronix() {
    if (enterAuthIronixConfigurado) return;

    enterAuthIronixConfigurado = true;

    document.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;

        const elementoActivo = document.activeElement;

        if (!elementoActivo) return;

        const tag = elementoActivo.tagName.toLowerCase();

        /*
            Solo reaccionar si el usuario está escribiendo en un input.
            Esto evita que Enter afecte otras partes del sistema.
        */
        if (tag !== "input") return;

        /*
            LOGIN
        */
        const login = document.getElementById("login");

        if (login && estaVisible(login) && login.contains(elementoActivo)) {
            e.preventDefault();

            const botonLogin = login.querySelector("button");

            if (botonLogin && !botonLogin.disabled) {
                botonLogin.click();
            }

            return;
        }

        /*
            RECUPERAR CONTRASEÑA
        */
        const recuperar = document.getElementById("recuperar");

        if (recuperar && estaVisible(recuperar) && recuperar.contains(elementoActivo)) {
            e.preventDefault();

            const paso1 = document.getElementById("paso1");
            const paso2 = document.getElementById("paso2");
            const paso3 = document.getElementById("paso3");

            /*
                PASO 1:
                Email de recuperación → Enviar código
            */
            if (paso1 && estaVisible(paso1)) {
                const botonEnviar = paso1.querySelector("button");

                if (botonEnviar && !botonEnviar.disabled) {
                    botonEnviar.click();
                }

                return;
            }

            /*
                PASO 2:
                Código → Verificar código
            */
            if (paso2 && estaVisible(paso2)) {
                const botonVerificar = paso2.querySelector("button");

                if (botonVerificar && !botonVerificar.disabled) {
                    botonVerificar.click();
                }

                return;
            }

            /*
                PASO 3:
                Nueva contraseña → Confirmar cambio
            */
            if (paso3 && estaVisible(paso3)) {
                const botonCambiar = paso3.querySelector("button");

                if (botonCambiar && !botonCambiar.disabled) {
                    botonCambiar.click();
                }

                return;
            }
        }
    });
}


/* ===============================
   UTILIDAD - VALIDAR VISIBILIDAD
================================ */

function estaVisible(elemento) {
    return !!(
        elemento.offsetWidth ||
        elemento.offsetHeight ||
        elemento.getClientRects().length
    );
}