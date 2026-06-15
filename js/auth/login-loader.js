/* ===============================
   CARGAR AUTH IRONIX
================================ */

document.addEventListener("DOMContentLoaded", () => {
    cargarAuthIronix();
});


/* ===============================
   VALIDAR SESIÓN PHP REAL
================================ */

async function verificarSesionInicialIronix() {
    try {
        const respuesta = await fetch("php/auth/verificar_sesion.php", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.success || !datos.auth || !datos.user) {
            localStorage.removeItem("user");

            return {
                success: false,
                auth: false,
                message: datos.message || "Sesión no iniciada o expirada"
            };
        }

        localStorage.setItem("user", JSON.stringify(datos.user));

        return {
            success: true,
            auth: true,
            user: datos.user
        };

    } catch (error) {
        console.error("Error verificando sesión inicial:", error);

        localStorage.removeItem("user");

        return {
            success: false,
            auth: false,
            message: "No se pudo verificar la sesión inicial",
            error: error.message
        };
    }
}


/* ===============================
   MOSTRAR AUTH
================================ */

function mostrarAuthIronix() {
    const authContainer = document.getElementById("authContainer");
    const app = document.getElementById("app");
    const login = document.getElementById("login");
    const recuperar = document.getElementById("recuperar");

    document.body.classList.remove("usuario-logueado");

    if (app) {
        app.style.setProperty("display", "none", "important");
        app.style.setProperty("visibility", "hidden", "important");
        app.style.setProperty("opacity", "0", "important");
    }

    if (authContainer) {
        authContainer.style.setProperty("display", "block", "important");
        authContainer.style.setProperty("visibility", "visible", "important");
        authContainer.style.setProperty("opacity", "1", "important");
    }

    /*
        IMPORTANTE:
        iniciarApp() oculta #login con !important.
        Al cerrar sesión hay que restaurarlo explícitamente.
    */
    if (login) {
        login.style.setProperty("display", "flex", "important");
        login.style.setProperty("visibility", "visible", "important");
        login.style.setProperty("opacity", "1", "important");
        login.style.setProperty("pointer-events", "auto", "important");
    }

    if (recuperar) {
        recuperar.style.setProperty("display", "none", "important");
        recuperar.style.setProperty("visibility", "hidden", "important");
        recuperar.style.setProperty("opacity", "0", "important");
        recuperar.style.setProperty("pointer-events", "none", "important");
    }
}


/* ===============================
   MOSTRAR APP
================================ */

function mostrarAppIronix() {
    const authContainer = document.getElementById("authContainer");
    const app = document.getElementById("app");

    if (authContainer) {
        authContainer.style.display = "none";
    }

    if (app) {
        app.style.display = "block";
    }
}


/* ===============================
   CARGAR AUTH IRONIX
================================ */

async function cargarAuthIronix() {
    const authContainer = document.getElementById("authContainer");

    if (!authContainer) {
        console.error("No existe #authContainer en inicio.html");
        return;
    }

    try {
        const [loginResponse, recuperarResponse] = await Promise.all([
            fetch("views/auth/login.html", { cache: "no-store" }),
            fetch("views/auth/recuperar.html", { cache: "no-store" })
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

        /*
            VALIDACIÓN REAL:
            Ya no se confía solo en localStorage.
            Primero se consulta la sesión PHP real.
        */
        const sesion = await verificarSesionInicialIronix();

        if (sesion.success && sesion.auth) {
            console.log("Sesión PHP activa. Cargando sistema IRONIX...");

            mostrarAppIronix();

            if (typeof iniciarAppConLoaderIronix === "function") {
                await iniciarAppConLoaderIronix(true);
            }

            return;
        }

        console.warn("No hay sesión PHP activa. Mostrando login.");

        localStorage.removeItem("user");
        mostrarAuthIronix();

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
   INICIAR APP CON LOADER IRONIX
   Esta función será usada por:
   - sesión ya iniciada
   - login exitoso
================================ */

async function iniciarAppConLoaderIronix(mantenerSesion = false) {
    /*
        Seguridad extra:
        si se intenta iniciar manteniendo sesión,
        confirmamos que la sesión PHP real siga activa.
    */
    if (mantenerSesion) {
        const sesion = await verificarSesionInicialIronix();

        if (!sesion.success || !sesion.auth) {
            console.warn("No se puede iniciar la app: sesión PHP inválida");

            localStorage.removeItem("user");
            mostrarAuthIronix();

            return;
        }
    }

    mostrarAppIronix();

    /*
        Si el loader existe, se usa la pantalla completa.
        Si por algún motivo no existe, inicia la app normal.
    */
    if (typeof ejecutarCargaSistemaConLoader === "function") {
        await ejecutarCargaSistemaConLoader(async function () {
            if (typeof iniciarApp === "function") {
                await iniciarApp(mantenerSesion);
            } else {
                console.error("No existe la función iniciarApp()");
            }
        });

        return;
    }

    /*
        Fallback de seguridad:
        evita que el sistema quede bloqueado si el loader falla.
    */
    if (typeof iniciarApp === "function") {
        await iniciarApp(mantenerSesion);
    } else {
        console.error("No existe la función iniciarApp()");
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