/* ==================================================
   IRONIX - AUTH CORE

   Responsabilidad de este archivo:
   - Ejecutar login contra php/auth/login.php.
   - Guardar usuario local solo después de login correcto.
   - Iniciar la app únicamente si la sesión PHP fue verificada.
   - Actualizar datos visuales del usuario.
   - Ejecutar logout contra php/auth/logout.php.
   - Limpiar app, sidebar, loader y localStorage al cerrar sesión.

   IMPORTANTE:
   iniciarApp() no debe abrir el sistema si:
   window.IRONIX_SESION_PHP_VERIFICADA !== true
================================================== */

/* ===============================
   LOGIN
================================ */

let loginIronixEnProceso = false;

async function login() {
    if (loginIronixEnProceso) return;

    const email = document.getElementById("email")?.value.trim();
    const pass = document.getElementById("password")?.value.trim();
    const error = document.getElementById("error");

    if (error) error.textContent = "";

    if (!email || !pass) {
        if (error) error.textContent = "Completa correo y contraseña";
        return;
    }

    loginIronixEnProceso = true;

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

            if (error) {
                error.textContent = "Respuesta inválida del servidor";
            }

            return;
        }

        if (data.success) {
            window.IRONIX_CERRANDO_SESION = false;
            localStorage.setItem("user", JSON.stringify(data.user));

            /*
                Carga del sistema usando pantalla completa IRONIX.
                Si el loader existe, se usa.
                Si no existe, inicia la app normal como respaldo.
            */
            if (typeof iniciarAppConLoaderIronix === "function") {
                await iniciarAppConLoaderIronix(true);
            } else {
                await iniciarApp(true);
            }

        } else {
            if (error) {
                error.textContent = data.message || "Datos incorrectos";
            }
        }

    } catch (err) {
        console.error("Error login:", err);

        if (error) {
            error.textContent = "Error al conectar con el servidor";
        }

    } finally {
        loginIronixEnProceso = false;
    }
}


/* ===============================
   INICIAR APP
================================ */

async function iniciarApp(cargarDashboard = false) {
    if (window.IRONIX_CERRANDO_SESION === true) {
        console.warn("Inicio de app bloqueado: cierre de sesión en proceso");
        return;
    }

    /*
        Seguridad:
        iniciarApp() no debe abrir el sistema solo porque exista localStorage.
        La sesión PHP real debe haber sido validada antes por login-loader.js
        usando php/auth/verificar_sesion.php.
    */
    if (window.IRONIX_SESION_PHP_VERIFICADA !== true) {
        console.warn("Inicio de app bloqueado: sesión PHP no verificada");

        localStorage.removeItem("user");

        if (typeof mostrarAuthIronix === "function") {
            mostrarAuthIronix();
        }

        return;
    }

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
        app.style.setProperty("pointer-events", "auto", "important");
    }

    if (contenido) {
        contenido.style.setProperty("display", "block", "important");
        contenido.style.setProperty("visibility", "visible", "important");
        contenido.style.setProperty("opacity", "1", "important");
        contenido.style.setProperty("pointer-events", "auto", "important");
    }

    /*
    Si el sidebar fue limpiado al cerrar sesión,
    se vuelve a cargar antes de actualizar usuario y permisos.
    */
    const sidebarContainer = document.getElementById("sidebarContainer");

    if (
        sidebarContainer &&
        sidebarContainer.innerHTML.trim() === "" &&
        typeof cargarSidebarIronix === "function"
    ) {
        await cargarSidebarIronix();
    }

    actualizarUsuarioSidebar();

    if (typeof aplicarPermisosNavegacion === "function") {
        aplicarPermisosNavegacion();
    }

    const userTexto = document.getElementById("user");

    if (userTexto) {
        userTexto.textContent = "Hola " + (user.nombre || "Usuario") + " 👋";
    }

    /*
    Cargar Dashboard inicial una sola vez.
    Esto evita dobles cargas si login-loader.js, el loader o alguna función
    intentan iniciar la app más de una vez en la misma sesión.
    */
    if (cargarDashboard && typeof showSection === "function") {

        if (window.IRONIX_DASHBOARD_INICIAL_CARGANDO === true) {
            console.warn("Carga inicial del Dashboard ya está en proceso");

        } else if (window.IRONIX_DASHBOARD_INICIAL_CARGADO === true) {
            console.log("Dashboard inicial ya fue cargado en esta sesión");

        } else {
            window.IRONIX_DASHBOARD_INICIAL_CARGANDO = true;

            try {
                await esperarInicioDashboardIronix();
                await showSection("dashboard");

                window.IRONIX_DASHBOARD_INICIAL_CARGADO = true;

            } finally {
                window.IRONIX_DASHBOARD_INICIAL_CARGANDO = false;
            }
        }
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
   ESPERA BREVE PARA LAYOUT
================================ */

function esperarInicioDashboardIronix(ms = 120) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
   SINCRONIZAR SESIÓN Y PERMISOS
================================ */

function obtenerUrlFetchIronix(input) {
    if (typeof input === "string") {
        return input;
    }

    if (input && typeof input.url === "string") {
        return input.url;
    }

    return "";
}

function ironixDebeRevalidarSesionFrontend() {
    const user = localStorage.getItem("user");

    return !!(
        user &&
        window.IRONIX_CERRANDO_SESION !== true
    );
}

async function sincronizarSesionIronixSilenciosa() {
    if (window.IRONIX_SINCRONIZANDO_SESION === true) {
        return false;
    }

    if (typeof verificarSesionInicialIronix !== "function") {
        return false;
    }

    if (!ironixDebeRevalidarSesionFrontend()) {
        return false;
    }

    window.IRONIX_SINCRONIZANDO_SESION = true;

    try {
        const sesion = await verificarSesionInicialIronix();

        if (sesion.success && sesion.auth && sesion.user) {
            window.IRONIX_SESION_PHP_VERIFICADA = true;
            localStorage.setItem("user", JSON.stringify(sesion.user));

            actualizarUsuarioSidebar();

            if (typeof aplicarPermisosNavegacion === "function") {
                aplicarPermisosNavegacion();
            }

            return true;
        }

        forzarCierreSesionLocalIronix(
            sesion.message || "Tu sesión expiró. Inicia sesión nuevamente."
        );

        return false;

    } catch (error) {
        console.error("Error sincronizando sesión IRONIX:", error);
        return false;

    } finally {
        window.IRONIX_SINCRONIZANDO_SESION = false;
    }
}


/* ===============================
   FORZAR CIERRE LOCAL
================================ */

function forzarCierreSesionLocalIronix(mensaje = "") {
    if (window.IRONIX_FORZANDO_CIERRE_LOCAL === true) {
        return;
    }

    window.IRONIX_FORZANDO_CIERRE_LOCAL = true;

    window.IRONIX_CERRANDO_SESION = true;
    window.IRONIX_SESION_PHP_VERIFICADA = false;
    window.IRONIX_DASHBOARD_INICIAL_CARGADO = false;
    window.IRONIX_DASHBOARD_INICIAL_CARGANDO = false;

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

    /*
        Fase 5:
        Limpiar estado visual de navegación para evitar que quede
        una sección antigua marcada después de sesión expirada,
        usuario bloqueado o logout.
    */
    window.IRONIX_SECCION_ACTUAL = null;

    document.querySelectorAll(".menu button.active")
        .forEach(boton => boton.classList.remove("active"));

    document.querySelectorAll(".section.active")
        .forEach(seccion => seccion.classList.remove("active"));

    const loaderSistema = document.getElementById("ironixLoaderSistema");

    if (loaderSistema) {
        loaderSistema.style.setProperty("display", "none", "important");
        loaderSistema.style.setProperty("visibility", "hidden", "important");
        loaderSistema.style.setProperty("opacity", "0", "important");
        loaderSistema.style.setProperty("pointer-events", "none", "important");
    }

    if (typeof mostrarAuthIronix === "function") {
        mostrarAuthIronix("login");

    } else {
        const authContainer = document.getElementById("authContainer");
        const login = document.getElementById("login");
        const recuperar = document.getElementById("recuperar");

        if (authContainer) {
            authContainer.style.setProperty("display", "block", "important");
            authContainer.style.setProperty("visibility", "visible", "important");
            authContainer.style.setProperty("opacity", "1", "important");
            authContainer.style.setProperty("pointer-events", "auto", "important");
        }

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

    if (mensaje) {
        const error = document.getElementById("error");

        if (error) {
            error.textContent = mensaje;
        }
    }

    setTimeout(function () {
        window.IRONIX_FORZANDO_CIERRE_LOCAL = false;
    }, 300);
}


/* ===============================
   LOGOUT
================================ */

async function logout() {
    await cerrarSesionIronix();
}

async function cerrarSesionIronix() {
    console.log("Cerrando sesión IRONIX...");

    window.IRONIX_CERRANDO_SESION = true;
    window.IRONIX_SESION_PHP_VERIFICADA = false;
    window.IRONIX_DASHBOARD_INICIAL_CARGADO = false;
    window.IRONIX_DASHBOARD_INICIAL_CARGANDO = false;

    localStorage.removeItem("user");
    document.body.classList.remove("usuario-logueado");

    try {
        const respuesta = await fetch("php/auth/logout.php", {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store"
        });

        let datos = null;

        try {
            datos = await respuesta.json();
        } catch (errorJson) {
            datos = {
                success: respuesta.ok,
                message: "Respuesta logout no JSON"
            };
        }

        console.log("Respuesta logout.php:", datos);

    } catch (error) {
        console.error("Error cerrando sesión en servidor:", error);

    } finally {
        forzarCierreSesionLocalIronix("");
        console.log("Sesión IRONIX cerrada correctamente");
    }
}


/* ===============================
   INTERCEPTOR GLOBAL FETCH AUTH
================================ */

(function instalarInterceptorFetchAuthIronix() {
    if (window.IRONIX_FETCH_AUTH_INTERCEPTOR_INSTALADO === true) {
        return;
    }

    if (typeof window.fetch !== "function") {
        return;
    }

    const fetchOriginalIronix = window.fetch.bind(window);

    window.IRONIX_FETCH_AUTH_INTERCEPTOR_INSTALADO = true;
    window.IRONIX_FETCH_ORIGINAL = fetchOriginalIronix;

    window.fetch = async function (input, init = {}) {
        const respuesta = await fetchOriginalIronix(input, init);

        try {
            const url = obtenerUrlFetchIronix(input);

            const esEndpointPhpIronix = url.includes("php/");
            const esEndpointAuthIronix = url.includes("php/auth/");

            if (esEndpointPhpIronix && !esEndpointAuthIronix) {

                /*
                    401:
                    Sesión expirada, usuario bloqueado, usuario inactivo
                    o sesión inválida en backend.
                */
                if (respuesta.status === 401) {
                    forzarCierreSesionLocalIronix(
                        "Tu sesión expiró o tu cuenta ya no está activa. Inicia sesión nuevamente."
                    );
                }

                /*
                    403:
                    El usuario sigue autenticado, pero sus permisos cambiaron
                    o no tiene permiso para esa acción.
                    No se cierra sesión, solo se refrescan permisos.
                */
                if (respuesta.status === 403) {
                    sincronizarSesionIronixSilenciosa();
                }
            }

        } catch (error) {
            console.warn("No se pudo evaluar respuesta auth IRONIX:", error);
        }

        return respuesta;
    };
})();


/* ===============================
   REVALIDAR AL VOLVER A LA APP
================================ */

function solicitarSincronizacionSesionIronix() {
    if (!ironixDebeRevalidarSesionFrontend()) {
        return;
    }

    const ahora = Date.now();
    const ultimaRevalidacion = window.IRONIX_ULTIMA_REVALIDACION_FRONTEND || 0;

    /*
        Evita múltiples verificaciones seguidas por focus + visibilitychange.
    */
    if (ahora - ultimaRevalidacion < 10000) {
        return;
    }

    window.IRONIX_ULTIMA_REVALIDACION_FRONTEND = ahora;

    sincronizarSesionIronixSilenciosa();
}

(function configurarRevalidacionSesionPorFocoIronix() {
    if (window.IRONIX_REVALIDACION_FOCO_INSTALADA === true) {
        return;
    }

    window.IRONIX_REVALIDACION_FOCO_INSTALADA = true;

    window.addEventListener("focus", function () {
        solicitarSincronizacionSesionIronix();
    });

    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") {
            solicitarSincronizacionSesionIronix();
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