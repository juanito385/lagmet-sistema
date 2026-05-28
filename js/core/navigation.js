async function showSection(seccion) {

    console.log("Cargando sección:", seccion);

    const contenido = document.getElementById("contenido");

    if (!contenido) {
        console.error("No existe el contenedor #contenido");
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