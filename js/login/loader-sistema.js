/* ===============================
   LOADER SISTEMA IRONIX
   Carga dinámica del HTML + CSS
================================ */

let ironixLoaderSistemaCargado = false;

/* ===============================
   INICIALIZAR LOADER
================================ */

async function inicializarLoaderSistema() {
    if (ironixLoaderSistemaCargado) return;

    cargarCSSLoaderSistema();

    const loaderExistente = document.getElementById("ironixLoaderSistema");

    if (loaderExistente) {
        ironixLoaderSistemaCargado = true;
        return;
    }

    try {
        const respuesta = await fetch("views/componentes/loader-sistema.html", {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar loader-sistema.html");
        }

        const html = await respuesta.text();

        document.body.insertAdjacentHTML("beforeend", html);

        ironixLoaderSistemaCargado = true;

    } catch (error) {
        console.error("Error inicializando loader del sistema:", error);
    }
}

/* ===============================
   CARGAR CSS DINÁMICAMENTE
================================ */

function cargarCSSLoaderSistema() {
    const cssExistente = document.querySelector('link[href="css/login/loader-sistema.css"]');

    if (cssExistente) return;

    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = "css/login/loader-sistema.css";

    document.head.appendChild(link);
}

/* ===============================
   MOSTRAR / OCULTAR
================================ */

async function mostrarLoaderSistema(texto = "Preparando entorno de trabajo...") {
    await inicializarLoaderSistema();

    const loader = document.getElementById("ironixLoaderSistema");

    if (!loader) return;

    actualizarTextoLoaderSistema(texto);
    loader.classList.remove("oculto");
}

function ocultarLoaderSistema() {
    const loader = document.getElementById("ironixLoaderSistema");

    if (!loader) return;

    loader.classList.add("oculto");
}

/* ===============================
   ACTUALIZAR TEXTO Y PROGRESO
================================ */

function actualizarTextoLoaderSistema(texto) {
    const loaderTexto = document.getElementById("ironixLoaderTexto");

    if (loaderTexto) {
        loaderTexto.textContent = texto;
    }
}

function actualizarFooterLoaderSistema(texto) {
    const footer = document.getElementById("ironixLoaderEstadoFooter");

    if (footer) {
        footer.textContent = texto;
    }
}

function actualizarProgresoLoaderSistema(porcentaje) {
    const barra = document.getElementById("ironixLoaderProgreso");
    const texto = document.getElementById("ironixLoaderPorcentaje");

    const valor = Math.max(0, Math.min(100, porcentaje));

    if (barra) {
        barra.style.width = valor + "%";
    }

    if (texto) {
        texto.textContent = valor + "%";
    }
}

/* ===============================
   ACTUALIZAR PASOS
================================ */

function actualizarPasoLoaderSistema(idPaso, estado) {
    const paso = document.getElementById(idPaso);

    if (!paso) return;

    const textoEstado = paso.querySelector("em");

    paso.classList.remove("active", "done");

    if (estado === "active") {
        paso.classList.add("active");

        if (textoEstado) {
            textoEstado.textContent = "En progreso";
        }
    }

    if (estado === "done") {
        paso.classList.add("done");

        if (textoEstado) {
            textoEstado.textContent = "Completado";
        }
    }

    if (estado === "pending") {
        if (textoEstado) {
            textoEstado.textContent = "Pendiente";
        }
    }
}

/* ===============================
   UTILIDAD DE ESPERA
================================ */

function esperarLoaderSistema(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* ===============================
   REINICIAR ESTADO DEL LOADER
================================ */

function reiniciarLoaderSistema() {
    actualizarTextoLoaderSistema("Preparando entorno de trabajo...");
    actualizarFooterLoaderSistema("Conectando componentes...");
    actualizarProgresoLoaderSistema(0);

    actualizarPasoLoaderSistema("loaderPasoSesion", "active");
    actualizarPasoLoaderSistema("loaderPasoDashboard", "pending");
    actualizarPasoLoaderSistema("loaderPasoModulos", "pending");
    actualizarPasoLoaderSistema("loaderPasoListo", "pending");
}

/* ===============================
   SECUENCIA VISUAL DE CARGA
================================ */

async function ejecutarCargaSistemaConLoader(callbackCargaSistema = null) {
    await mostrarLoaderSistema("Inicializando IRONIX...");
    reiniciarLoaderSistema();

    try {
        /* =========================
           PASO 1: SESIÓN
        ========================= */
        actualizarTextoLoaderSistema("Validando sesión de usuario...");
        actualizarFooterLoaderSistema("Verificando credenciales...");
        actualizarProgresoLoaderSistema(15);

        await esperarLoaderSistema(350);

        actualizarPasoLoaderSistema("loaderPasoSesion", "done");

        /* =========================
           PASO 2: DASHBOARD
        ========================= */
        actualizarPasoLoaderSistema("loaderPasoDashboard", "active");
        actualizarTextoLoaderSistema("Cargando Dashboard...");
        actualizarFooterLoaderSistema("Preparando panel principal...");
        actualizarProgresoLoaderSistema(40);

        await esperarLoaderSistema(350);

        /* 
            Aquí se ejecutará la carga real del sistema:
            - iniciarApp()
            - cargar sidebar
            - cargar dashboard
            - showSection("dashboard")
        */
        if (typeof callbackCargaSistema === "function") {
            await callbackCargaSistema();
        }

        actualizarPasoLoaderSistema("loaderPasoDashboard", "done");

        /* =========================
           PASO 3: MÓDULOS
        ========================= */
        actualizarPasoLoaderSistema("loaderPasoModulos", "active");
        actualizarTextoLoaderSistema("Sincronizando módulos del sistema...");
        actualizarFooterLoaderSistema("Conectando componentes internos...");
        actualizarProgresoLoaderSistema(72);

        await esperarLoaderSistema(450);

        actualizarPasoLoaderSistema("loaderPasoModulos", "done");

        /* =========================
           PASO 4: SISTEMA LISTO
        ========================= */
        actualizarPasoLoaderSistema("loaderPasoListo", "active");
        actualizarTextoLoaderSistema("Finalizando carga del sistema...");
        actualizarFooterLoaderSistema("Inicialización casi completa...");
        actualizarProgresoLoaderSistema(92);

        await esperarLoaderSistema(350);

        actualizarPasoLoaderSistema("loaderPasoListo", "done");
        actualizarTextoLoaderSistema("Sistema listo.");
        actualizarFooterLoaderSistema("Inicialización completada.");
        actualizarProgresoLoaderSistema(100);

        await esperarLoaderSistema(450);

    } catch (error) {
        console.error("Error durante la carga del sistema:", error);

        actualizarTextoLoaderSistema("Error al cargar el sistema.");
        actualizarFooterLoaderSistema("Revisa la consola para más detalles.");

        await esperarLoaderSistema(900);

        throw error;

    } finally {
        ocultarLoaderSistema();
    }
}