/* ==================================================
   IRONIX - LOGIN LOADER / GUARD DE SESIÓN INICIAL

   Responsabilidad de este archivo:
   - Cargar vistas de login y recuperación.
   - Verificar sesión PHP real con php/auth/verificar_sesion.php.
   - Activar window.IRONIX_SESION_PHP_VERIFICADA.
   - Mostrar login si no hay sesión.
   - Mostrar recuperación sin recargar la página.
   - Iniciar app con loader si la sesión PHP es válida.

   IMPORTANTE:
   Este archivo es la entrada principal del sistema.
   No debe confiar solo en localStorage.
================================================== */

/* ===============================
   ESTADO INTERNO AUTH
================================ */

let authIronixInicializado = false;
let enterAuthIronixConfigurado = false;

window.IRONIX_AUTH_MODO = window.IRONIX_AUTH_MODO || "login";


/* ===============================
   INICIAR AUTH IRONIX
================================ */

function iniciarAuthIronixSeguro() {
    if (authIronixInicializado) return;

    authIronixInicializado = true;
    cargarAuthIronix();
}

/*
    Corrección importante:
    Si este archivo se carga después de DOMContentLoaded,
    el listener antiguo no se ejecuta y puede quedar pantalla en blanco.
*/
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarAuthIronixSeguro);
} else {
    iniciarAuthIronixSeguro();
}


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

        let datos = null;

        try {
            datos = await respuesta.json();
        } catch (errorJson) {
            datos = {
                success: false,
                auth: false,
                message: "Respuesta inválida al verificar sesión"
            };
        }

        if (!respuesta.ok || !datos.success || !datos.auth || !datos.user) {
            window.IRONIX_SESION_PHP_VERIFICADA = false;
            window.IRONIX_DASHBOARD_INICIAL_CARGADO = false;
            window.IRONIX_DASHBOARD_INICIAL_CARGANDO = false;
            window.IRONIX_SECCION_ACTUAL = null;

            localStorage.removeItem("user");

            return {
                success: false,
                auth: false,
                message: datos.message || "Sesión no iniciada o expirada"
            };
        }

        window.IRONIX_SESION_PHP_VERIFICADA = true;
        localStorage.setItem("user", JSON.stringify(datos.user));

        return {
            success: true,
            auth: true,
            user: datos.user
        };

        } catch (error) {
        console.error("Error verificando sesión inicial:", error);

        window.IRONIX_SESION_PHP_VERIFICADA = false;
        window.IRONIX_DASHBOARD_INICIAL_CARGADO = false;
        window.IRONIX_DASHBOARD_INICIAL_CARGANDO = false;
        window.IRONIX_SECCION_ACTUAL = null;

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

function mostrarAuthIronix(modo = "login") {
    const authContainer = document.getElementById("authContainer");
    const app = document.getElementById("app");
    const login = document.getElementById("login");
    const recuperar = document.getElementById("recuperar");

    window.IRONIX_AUTH_MODO = modo === "recuperar" ? "recuperar" : "login";

    document.body.classList.remove("usuario-logueado");

    if (app) {
        app.style.setProperty("display", "none", "important");
        app.style.setProperty("visibility", "hidden", "important");
        app.style.setProperty("opacity", "0", "important");
        app.style.setProperty("pointer-events", "none", "important");
    }

    if (authContainer) {
        authContainer.style.setProperty("display", "block", "important");
        authContainer.style.setProperty("visibility", "visible", "important");
        authContainer.style.setProperty("opacity", "1", "important");
        authContainer.style.setProperty("pointer-events", "auto", "important");
    }

    if (login) {
        if (window.IRONIX_AUTH_MODO === "login") {
            login.style.setProperty("display", "flex", "important");
            login.style.setProperty("visibility", "visible", "important");
            login.style.setProperty("opacity", "1", "important");
            login.style.setProperty("pointer-events", "auto", "important");
        } else {
            login.style.setProperty("display", "none", "important");
            login.style.setProperty("visibility", "hidden", "important");
            login.style.setProperty("opacity", "0", "important");
            login.style.setProperty("pointer-events", "none", "important");
        }
    }

    if (recuperar) {
        if (window.IRONIX_AUTH_MODO === "recuperar") {
            recuperar.style.setProperty("display", "flex", "important");
            recuperar.style.setProperty("visibility", "visible", "important");
            recuperar.style.setProperty("opacity", "1", "important");
            recuperar.style.setProperty("pointer-events", "auto", "important");
        } else {
            recuperar.style.setProperty("display", "none", "important");
            recuperar.style.setProperty("visibility", "hidden", "important");
            recuperar.style.setProperty("opacity", "0", "important");
            recuperar.style.setProperty("pointer-events", "none", "important");
        }
    }
}


/* ===============================
   MOSTRAR LOGIN
================================ */

function mostrarLoginIronix(evento = null) {
    if (evento && typeof evento.preventDefault === "function") {
        evento.preventDefault();
    }

    window.IRONIX_AUTH_MODO = "login";
    mostrarAuthIronix("login");
}


/* ===============================
   MOSTRAR RECUPERAR CONTRASEÑA
================================ */

function mostrarRecuperarIronix(evento = null) {
    if (evento && typeof evento.preventDefault === "function") {
        evento.preventDefault();
    }

    window.IRONIX_AUTH_MODO = "recuperar";
    mostrarAuthIronix("recuperar");

    const paso1 = document.getElementById("paso1");
    const paso2 = document.getElementById("paso2");
    const paso3 = document.getElementById("paso3");

    if (paso1) {
        paso1.style.display = "block";
    }

    if (paso2) {
        paso2.style.display = "none";
    }

    if (paso3) {
        paso3.style.display = "none";
    }

    const emailRec = document.getElementById("emailRec");

    if (emailRec) {
        setTimeout(() => emailRec.focus(), 80);
    }
}


/* ===============================
   ALIAS COMPATIBLES CON HTML ANTIGUO
================================ */

/*
    Esto evita que botones antiguos con onclick="mostrarRecuperar()"
    o onclick="mostrarLogin()" rompan la pantalla.
*/

window.mostrarLoginIronix = mostrarLoginIronix;
window.mostrarRecuperarIronix = mostrarRecuperarIronix;

window.mostrarLogin = mostrarLoginIronix;
window.mostrarRecuperar = mostrarRecuperarIronix;
window.volverLogin = mostrarLoginIronix;
window.volverAlLogin = mostrarLoginIronix;


/* ===============================
   MOSTRAR APP
================================ */

function mostrarAppIronix() {
    const authContainer = document.getElementById("authContainer");
    const app = document.getElementById("app");

    document.body.classList.add("usuario-logueado");

    if (authContainer) {
        authContainer.style.setProperty("display", "none", "important");
        authContainer.style.setProperty("visibility", "hidden", "important");
        authContainer.style.setProperty("opacity", "0", "important");
        authContainer.style.setProperty("pointer-events", "none", "important");
    }

    if (app) {
        app.style.setProperty("display", "block", "important");
        app.style.setProperty("visibility", "visible", "important");
        app.style.setProperty("opacity", "1", "important");
        app.style.setProperty("pointer-events", "auto", "important");
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

        configurarEventosAuthIronix();
        configurarEnterAuthIronix();

        console.log("Auth IRONIX cargado correctamente");

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
        mostrarAuthIronix("login");

    } catch (error) {
        console.error("Error cargando Auth IRONIX:", error);

        authContainer.innerHTML = `
            <div style="
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #020617;
                color: #ffffff;
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 40px;
            ">
                <div>
                    <h2>Error cargando Auth IRONIX</h2>
                    <p>No se pudo cargar la pantalla de inicio de sesión.</p>
                    <p>Revisa la consola del navegador.</p>
                </div>
            </div>
        `;
    }
}


/* ===============================
   CONFIGURAR EVENTOS AUTH
================================ */

function configurarEventosAuthIronix() {
    const authContainer = document.getElementById("authContainer");

    if (!authContainer) return;

    authContainer.addEventListener("click", function (e) {
        const botonRecuperar = e.target.closest("[data-auth='recuperar'], .btn-recuperar, .link-recuperar, #btnMostrarRecuperar");
        const botonLogin = e.target.closest("[data-auth='login'], .btn-volver-login, .link-login, #btnMostrarLogin");

        if (botonRecuperar) {
            e.preventDefault();
            mostrarRecuperarIronix();
            return;
        }

        if (botonLogin) {
            e.preventDefault();
            mostrarLoginIronix();
            return;
        }
    });
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
            mostrarAuthIronix("login");

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
   PROTEGER HISTORIAL / BOTÓN ATRÁS
================================ */

function limpiarAppPorSesionInvalidaIronix(mensaje = "") {
    window.IRONIX_SESION_PHP_VERIFICADA = false;

    localStorage.removeItem("user");
    document.body.classList.remove("usuario-logueado");

    const app = document.getElementById("app");

    if (app) {
        app.style.setProperty("display", "none", "important");
        app.style.setProperty("visibility", "hidden", "important");
        app.style.setProperty("opacity", "0", "important");
        app.style.setProperty("pointer-events", "none", "important");
    }

    const contenido = document.getElementById("contenido");

    if (contenido) {
        contenido.innerHTML = "";
    }

    const sidebarContainer = document.getElementById("sidebarContainer");

    if (sidebarContainer) {
        sidebarContainer.innerHTML = "";
    }

    const loaderSistema = document.getElementById("ironixLoaderSistema");

    if (loaderSistema) {
        loaderSistema.style.setProperty("display", "none", "important");
        loaderSistema.style.setProperty("visibility", "hidden", "important");
        loaderSistema.style.setProperty("opacity", "0", "important");
        loaderSistema.style.setProperty("pointer-events", "none", "important");
    }

    if (typeof mostrarAuthIronix === "function") {
        mostrarAuthIronix("login");
    }

    if (mensaje) {
        const error = document.getElementById("error");

        if (error) {
            error.textContent = mensaje;
        }
    }
}


async function validarSesionPorHistorialIronix() {
    if (window.IRONIX_VALIDANDO_HISTORIAL === true) {
        return;
    }

    window.IRONIX_VALIDANDO_HISTORIAL = true;

    try {
        const usuarioLocal = localStorage.getItem("user");

        if (!usuarioLocal || window.IRONIX_CERRANDO_SESION === true) {
            limpiarAppPorSesionInvalidaIronix("");
            return;
        }

        const sesion = await verificarSesionInicialIronix();

        if (!sesion.success || !sesion.auth) {
            if (typeof forzarCierreSesionLocalIronix === "function") {
                forzarCierreSesionLocalIronix(
                    sesion.message || "Tu sesión expiró. Inicia sesión nuevamente."
                );
            } else {
                limpiarAppPorSesionInvalidaIronix(
                    sesion.message || "Tu sesión expiró. Inicia sesión nuevamente."
                );
            }
        }

    } catch (error) {
        console.error("Error validando sesión por historial:", error);

        limpiarAppPorSesionInvalidaIronix(
            "No se pudo validar la sesión. Inicia sesión nuevamente."
        );

    } finally {
        window.IRONIX_VALIDANDO_HISTORIAL = false;
    }
}


(function configurarProteccionHistorialAuthIronix() {
    if (window.IRONIX_PROTECCION_HISTORIAL_INSTALADA === true) {
        return;
    }

    window.IRONIX_PROTECCION_HISTORIAL_INSTALADA = true;

    window.addEventListener("pageshow", function (evento) {
        let esNavegacionBackForward = false;

        try {
            const navegacion = performance.getEntriesByType("navigation")[0];

            esNavegacionBackForward = !!(
                evento.persisted === true ||
                navegacion?.type === "back_forward"
            );

        } catch (error) {
            esNavegacionBackForward = evento.persisted === true;
        }

        if (esNavegacionBackForward) {
            validarSesionPorHistorialIronix();
        }
    });
})();


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