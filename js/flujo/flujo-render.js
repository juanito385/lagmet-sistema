/* =========================
   RENDERIZAR FLUJO
   Grilla dinámica tipo Excel con avance progresivo y cards vacías
========================= */
function renderizarFlujoProducto(producto) {
    const board = document.getElementById("flujoBoard");

    if (!board) return;

    const operaciones = obtenerOperacionesOrdenadas(producto);

    if (operaciones.length === 0) {
        board.innerHTML = `
            <div class="flujo-empty-state">
                <span class="material-symbols-outlined">account_tree</span>
                <h3>Producto sin operaciones</h3>
                <p>Este producto no tiene máquinas asociadas para construir el flujo.</p>
            </div>
        `;
        return;
    }

    const columnas = obtenerColumnasFlujo(operaciones);
    const operacionesVisibles = obtenerOperacionesVisibles(producto);

    board.innerHTML = `
        <div class="flujo-grid-proceso" style="--flujo-columnas: ${columnas.length};">

            <div class="flujo-grid-header">
                ${columnas.map(columna => `
                    <div class="flujo-grid-header-cell">
                        ${escaparHTML(columna)}
                    </div>
                `).join("")}
            </div>

            <div class="flujo-grid-body">
                ${columnas.map(columna => {
                    const operacionesColumna = operacionesVisibles
                        .map((operacion, index) => ({ ...operacion, indexGlobal: index }))
                        .filter(operacion => obtenerNombreColumnaOperacion(operacion) === columna);

                    return `
                        <div class="flujo-grid-column">
                            ${operacionesColumna.map(operacion => {
                                const siguienteVisible = operacionesVisibles[operacion.indexGlobal + 1] || null;
                                const siguienteReal = operaciones[operacion.indexGlobal + 1] || null;

                                const cardsTemporales = Array.isArray(flujoCardsVaciasAbajo[operacion.indexGlobal])
                                    ? flujoCardsVaciasAbajo[operacion.indexGlobal]
                                    : [];

                                const cantidadVacias = cardsTemporales.length;
                                const tieneCardVaciaAbajo = cantidadVacias > 0;

                                let tipoConector = "none";
                                let haySiguienteOculto = Boolean(siguienteReal) && !siguienteVisible;

                                if (tieneCardVaciaAbajo) {
                                    tipoConector = "down";
                                    haySiguienteOculto = false;
                                } else if (siguienteVisible) {
                                    const columnaActual = obtenerNombreColumnaOperacion(operacion);
                                    const columnaSiguiente = obtenerNombreColumnaOperacion(siguienteVisible);

                                    tipoConector = columnaActual === columnaSiguiente ? "down" : "right";
                                }

                                const cardPrincipal = crearTarjetaOperacion(
                                    operacion,
                                    operacion.indexGlobal,
                                    tipoConector,
                                    haySiguienteOculto
                                );

                                const cardsVacias = crearCardsVaciasAbajo(
                                    operacion,
                                    operacion.indexGlobal,
                                    cardsTemporales,
                                    siguienteVisible,
                                    siguienteReal
                                );

                                return cardPrincipal + cardsVacias;
                            }).join("")}
                        </div>
                    `;
                }).join("")}
            </div>

        </div>
    `;

    requestAnimationFrame(() => {
        dibujarConectoresDinamicosFlujo();
    });
}

/* =========================
   CREAR CARDS VACÍAS ABAJO
========================= */
function crearCardsVaciasAbajo(operacionBase, indexBase, cardsTemporales = [], siguienteVisible, siguienteReal) {
    if (!Array.isArray(cardsTemporales) || cardsTemporales.length <= 0) return "";

    let html = "";

    const cantidadVacias = cardsTemporales.length;

    for (let i = 1; i <= cantidadVacias; i++) {
        const esUltimaVacia = i === cantidadVacias;
        const cardTemporal = cardsTemporales[i - 1];

        let tipoConector = "none";
        let mostrarBotones = false;

        if (!esUltimaVacia) {
            tipoConector = "down";
        } else if (siguienteVisible) {
            const columnaActual = obtenerNombreColumnaOperacion(operacionBase);
            const columnaSiguiente = obtenerNombreColumnaOperacion(siguienteVisible);

            tipoConector = columnaActual === columnaSiguiente ? "down" : "right-up";
        } else if (siguienteReal) {
            mostrarBotones = true;
        }

        html += crearTarjetaVaciaOperacion(
            indexBase,
            i,
            cardTemporal,
            tipoConector,
            mostrarBotones
        );
    }

    return html;
}

/* =========================
   CREAR TARJETA VACÍA / TEMPORAL
========================= */
function crearTarjetaVaciaOperacion(indexBase, numeroPlaceholder, cardTemporal, tipoConector = "none", mostrarBotones = false) {
    const accionHTML = mostrarBotones
        ? `
            <button 
                class="flujo-grid-plus flujo-plus-right" 
                data-origen="placeholder"
                data-direccion="right"
                data-index-base="${indexBase}"
                title="Continuar flujo hacia la derecha">
                +
            </button>

            <button 
                class="flujo-grid-plus flujo-plus-down" 
                data-origen="placeholder"
                data-direccion="down"
                data-index-base="${indexBase}"
                title="Crear otra operación debajo">
                +
            </button>
        `
        : "";

    const atributosDinamicos = tipoConector === "right-up"
        ? `data-conector-dinamico="right-up" data-index-base="${indexBase}"`
        : "";

    const estaEditada = Boolean(cardTemporal?.editada);

    if (estaEditada) {
        const numeroVisual = obtenerNumeroVisualCardTemporal(indexBase, numeroPlaceholder);
        const titulo = cardTemporal.nombre || "Operación temporal";
        const duracion = formatearDuracion(cardTemporal.horas, cardTemporal.minutos);

        return `
            <div 
                class="flujo-grid-card-wrapper flujo-card-temporal-wrapper conector-${tipoConector}"
                data-card-temporal="true"
                data-index-base="${indexBase}"
                data-posicion-vacia="${numeroPlaceholder}"
                ${atributosDinamicos}>

                <div 
                    class="flujo-grid-card flujo-grid-card-temporal-editada"
                    data-tipo-card="temporal"
                    data-index-base="${indexBase}"
                    data-posicion-vacia="${numeroPlaceholder}">

                    <div class="flujo-grid-card-numero">
                        ${numeroVisual}
                    </div>

                    <div class="flujo-grid-card-info">
                        <strong>${numeroVisual}. ${escaparHTML(titulo)}</strong>
                        <span>${escaparHTML(duracion)}</span>
                    </div>

                    ${accionHTML}

                </div>
            </div>
        `;
    }

    return `
        <div 
            class="flujo-grid-card-wrapper flujo-card-vacia-wrapper conector-${tipoConector}"
            data-card-temporal="true"
            data-index-base="${indexBase}"
            data-posicion-vacia="${numeroPlaceholder}"
            ${atributosDinamicos}>

            <div 
                class="flujo-grid-card flujo-grid-card-vacia"
                data-tipo-card="vacia"
                data-index-base="${indexBase}"
                data-posicion-vacia="${numeroPlaceholder}"
                title="Editar nueva operación">

                <div class="flujo-grid-card-vacia-icon">
                    +
                </div>

                <div class="flujo-grid-card-info">
                    <strong>Nueva operación</strong>
                    <span>Vacía</span>
                </div>

                ${accionHTML}

            </div>
        </div>
    `;
}
