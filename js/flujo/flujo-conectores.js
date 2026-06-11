/* =========================
   DIBUJAR CONECTORES DINÁMICOS
   Une última card vacía con card real derecha
   usando bordes reales de las cards
========================= */
function dibujarConectoresDinamicosFlujo() {
    const body = document.querySelector("#flujoBoard .flujo-grid-body");

    if (!body) return;

    body.querySelectorAll(".flujo-conectores-svg").forEach(svg => svg.remove());

    const fuentes = body.querySelectorAll('[data-conector-dinamico="right-up"]');

    if (fuentes.length === 0) return;

    const bodyRect = body.getBoundingClientRect();
    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.classList.add("flujo-conectores-svg");
    svg.setAttribute("width", bodyRect.width);
    svg.setAttribute("height", bodyRect.height);
    svg.setAttribute("viewBox", `0 0 ${bodyRect.width} ${bodyRect.height}`);

    const defs = document.createElementNS(svgNS, "defs");

    const marker = document.createElementNS(svgNS, "marker");
    marker.setAttribute("id", "flujoArrowHead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "14");
    marker.setAttribute("refX", "10");
    marker.setAttribute("refY", "7");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "userSpaceOnUse");

    const arrow = document.createElementNS(svgNS, "polygon");
    arrow.setAttribute("points", "0 0, 10 7, 0 14");
    arrow.setAttribute("fill", "#247cff");

    marker.appendChild(arrow);
    defs.appendChild(marker);
    svg.appendChild(defs);

    fuentes.forEach(fuente => {
        const indexBase = parseInt(fuente.dataset.indexBase || "-1", 10);
        const indexDestino = indexBase + 1;

        const destino = body.querySelector(`[data-operacion-index="${indexDestino}"]`);

        if (!destino) return;

        const cardOrigen = fuente.querySelector(".flujo-grid-card");
        const cardDestino = destino.querySelector(".flujo-grid-card");

        if (!cardOrigen || !cardDestino) return;

        const puntoOrigen = obtenerPuntoBordeDerechoCardFlujo(cardOrigen, body);
        const puntoDestino = obtenerPuntoBordeIzquierdoCardFlujo(cardDestino, body);

        if (!puntoOrigen || !puntoDestino) return;

        const startX = puntoOrigen.x;
        const startY = puntoOrigen.y;

        const endX = puntoDestino.x;
        const endY = puntoDestino.y;

        if (endX <= startX) return;

        const distanciaX = endX - startX;

        /*
            Codo controlado:
            - Sale desde el borde derecho real de la card origen.
            - Sube o baja si corresponde.
            - Termina justo en el borde izquierdo real de la card destino.
        */
        const codoX = startX + Math.max(36, distanciaX * 0.35);

        const path = document.createElementNS(svgNS, "path");

        path.setAttribute(
            "d",
            [
                `M ${startX} ${startY}`,
                `L ${codoX} ${startY}`,
                `L ${codoX} ${endY}`,
                `L ${endX} ${endY}`
            ].join(" ")
        );

        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#247cff");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        path.setAttribute("marker-end", "url(#flujoArrowHead)");

        svg.appendChild(path);
    });

    body.appendChild(svg);
}

/* =========================
   PUNTOS DE ANCLAJE REALES
========================= */
function obtenerPuntoBordeDerechoCardFlujo(card, body) {
    if (!card || !body) return null;

    const cardRect = card.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();

    return {
        x: cardRect.right - bodyRect.left,
        y: cardRect.top - bodyRect.top + (cardRect.height / 2)
    };
}

function obtenerPuntoBordeIzquierdoCardFlujo(card, body) {
    if (!card || !body) return null;

    const cardRect = card.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();

    return {
        x: cardRect.left - bodyRect.left,
        y: cardRect.top - bodyRect.top + (cardRect.height / 2)
    };
}
