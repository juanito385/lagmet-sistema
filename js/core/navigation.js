/* =========================
   NAVEGACIÓN CON PERMISOS
========================= */

/* =========================
   OBTENER USUARIO ACTUAL
========================= */
function obtenerUsuarioNavegacion() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch (error) {
        console.error("Error leyendo usuario en navegación:", error);
        return null;
    }
}

/* =========================
   VALIDAR PERMISO DE MÓDULO
========================= */
function usuarioPuedeVerSeccion(seccion) {
    const user = obtenerUsuarioNavegacion();

    if (!user) return false;

    /*
        El admin siempre tiene acceso total.
    */
    if (user.rol === "admin") return true;

    /*
        Perfil siempre debe estar disponible para el usuario logueado,
        salvo que más adelante decidas bloquearlo explícitamente.
    */
    if (seccion === "perfil") return true;

    if (!user.permisos) return false;

    const permiso = user.permisos[seccion];

    if (!permiso) return false;

    return permiso.ver === true;
}

/* =========================
   OCULTAR BOTONES SIN PERMISO
========================= */
function aplicarPermisosNavegacion() {
    const user = obtenerUsuarioNavegacion();

    if (!user) return;

    const botones = document.querySelectorAll("button[onclick^=\"showSection\"]");

    botones.forEach(boton => {
        const onclick = boton.getAttribute("onclick") || "";

        const match = onclick.match(/showSection\('(.+?)'\)/);

        if (!match) return;

        const seccion = match[1];

        if (usuarioPuedeVerSeccion(seccion)) {
            boton.style.display = "";
        } else {
            boton.style.display = "none";
        }
    });

    console.log("Permisos de navegación aplicados correctamente:", user.permisos || {});
}

/* =========================
   MENSAJE ACCESO DENEGADO
========================= */
function mostrarAccesoDenegado(seccion) {
    const contenido = document.getElementById("contenido");

    if (!contenido) return;

    contenido.innerHTML = `
        <div class="section active">
            <div style="
                padding: 28px;
                border-radius: 16px;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,70,70,0.35);
                box-shadow: 0 15px 35px rgba(0,0,0,0.25);
                color: #fff;
            ">
                <h2 style="margin:0 0 10px; color:#ff6b6b;">
                    Acceso denegado
                </h2>
                <p style="margin:0; color:#cfd6e6;">
                    No tienes permiso para acceder a la sección 
                    <strong>${seccion}</strong>.
                </p>
            </div>
        </div>
    `;
}

/* =========================
   CARGAR SECCIÓN
========================= */
async function showSection(seccion) {

    console.log("Cargando sección:", seccion);

    const contenido = document.getElementById("contenido");

    if (!contenido) {
        console.error("No existe el contenedor #contenido");
        return;
    }

    /*
        Bloqueo por permisos antes de cargar la vista.
    */
    if (!usuarioPuedeVerSeccion(seccion)) {
        console.warn("Acceso bloqueado por permisos:", seccion);
        mostrarAccesoDenegado(seccion);
        return;
    }

    try {

        const response = await fetch(`views/${seccion}.html?v=${Date.now()}`, {
            cache: "no-store"
        });

        console.log("Respuesta vista:", response.status, response.url);

        if (!response.ok) {
            throw new Error(`No se pudo cargar views/${seccion}.html`);
        }

        const html = await response.text();
        contenido.innerHTML = html;

        const seccionCargada = contenido.querySelector(".section");

        if (seccionCargada) {
            seccionCargada.classList.add("active");
        }

        document.querySelectorAll(".menu button")
            .forEach(btn => btn.classList.remove("active"));

        const botonActivo = document.querySelector(
            `.menu button[onclick="showSection('${seccion}')"]`
        );

        if (botonActivo) {
            botonActivo.classList.add("active");
        }

        if (seccion === "dashboard") {

            if (typeof inicializarFiltrosDashboard === "function") {
                inicializarFiltrosDashboard();
            }

            if (typeof inicializarCalendarioDashboard === "function") {
                inicializarCalendarioDashboard();
            }

            if (typeof cargarDashboard === "function") {
                await cargarDashboard();
            }

        }

        if (seccion === "monitoreo") {
            if (typeof iniciarMonitoreo === "function") {
                await iniciarMonitoreo();
            }
        }

        if (seccion === "productos") {
            if (typeof renderProductos === "function") {
                renderProductos();
            }
        }

        if (seccion === "documentacion") {

            if (typeof cargarPanelAccionesGantt === "function") {
                await cargarPanelAccionesGantt();
            }

            if (typeof cargarModalExportarGantt === "function") {
                await cargarModalExportarGantt();
            }

            if (typeof cargarModalAlertasGantt === "function") {
                await cargarModalAlertasGantt();
            }

            if (typeof mostrarGanttPorMaquina === "function") {
                mostrarGanttPorMaquina();
            }

        }

        if (seccion === "configuracion") {
            if (typeof cargarConfiguracion === "function") {
                cargarConfiguracion();
            }
        }

        if (seccion === "flujo-proceso") {
            if (typeof iniciarFlujoProceso === "function") {
                iniciarFlujoProceso();
            }
        }

        if (seccion === "estados") {
            const seccionEstados = document.querySelector(".estados-section");

            if (seccionEstados) {
                seccionEstados.dataset.cardsCargadas = "true";
            }

            if (typeof cargarCardsEstadosProduccion === "function") {
                await cargarCardsEstadosProduccion();
            }
        }

    } catch (error) {

        console.error("Error cargando sección:", error);

        contenido.innerHTML = `
            <div class="section active">
                <h2>Error al cargar sección</h2>
                <p>No se encontró o falló: views/${seccion}.html</p>
            </div>
        `;
    }
}

/* =========================
   INICIAR PERMISOS VISUALES
========================= */
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        aplicarPermisosNavegacion();
    }, 100);
});

/* =========================
   REAPLICAR PERMISOS VISUALES
========================= */
function refrescarPermisosNavegacion() {
    setTimeout(() => {
        aplicarPermisosNavegacion();
    }, 150);
}

window.aplicarPermisosNavegacion = aplicarPermisosNavegacion;
window.refrescarPermisosNavegacion = refrescarPermisosNavegacion;