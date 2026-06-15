/* ==================================================
   IRONIX - LAYOUT LOADER
   Carga componentes estructurales del sistema.

   Ruta: js/core/layout-loader.js
================================================== */

async function cargarSidebarIronix() {
    const contenedor = document.getElementById("sidebarContainer");

    if (!contenedor) {
        console.warn("No se encontró #sidebarContainer");
        return;
    }

    try {
        const respuesta = await fetch(`views/layout/sidebar.html?v=${Date.now()}`, {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar views/layout/sidebar.html");
        }

        contenedor.innerHTML = await respuesta.text();

        console.log("Sidebar IRONIX cargado correctamente");

        /*
            Después de cargar el sidebar dinámico:
            1. Actualiza avatar, nombre y rol.
            2. Aplica permisos visuales a los botones del menú.
        */
        if (typeof actualizarUsuarioSidebar === "function") {
            actualizarUsuarioSidebar();
        }

        if (typeof aplicarPermisosNavegacion === "function") {
            aplicarPermisosNavegacion();
        }

    } catch (error) {
        console.error("Error cargando Sidebar IRONIX:", error);
    }
}
async function cargarLayoutIronix() {
    await cargarSidebarIronix();
}

document.addEventListener("DOMContentLoaded", cargarLayoutIronix);