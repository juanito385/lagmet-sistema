/* =========================
   NUMERACIÓN VISUAL
========================= */
function contarCardsTemporalesEditadasAntes(indexOperacion) {
    let total = 0;

    Object.entries(flujoCardsVaciasAbajo).forEach(([indexBase, cards]) => {
        const base = parseInt(indexBase, 10);

        if (Number.isNaN(base)) return;
        if (base >= indexOperacion) return;
        if (!Array.isArray(cards)) return;

        total += cards.filter(card => card.editada).length;
    });

    return total;
}

function obtenerNumeroVisualOperacionReal(indexOperacion) {
    return indexOperacion + 1 + contarCardsTemporalesEditadasAntes(indexOperacion);
}

function obtenerNumeroVisualCardTemporal(indexBase, posicionVacia) {
    return obtenerNumeroVisualOperacionReal(indexBase) + posicionVacia;
}
