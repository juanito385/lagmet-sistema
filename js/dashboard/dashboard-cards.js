/* =========================
   CARDS SUPERIORES
========================= */
function cargarCards(cards) {
    actualizarTexto("dashTotalProductos", cards.total_productos ?? 0);
    actualizarTexto("dashProductosProceso", cards.productos_proceso ?? 0);
    actualizarTexto("dashMaquinasOperativas", cards.maquinas_operativas ?? 0);
    actualizarTexto("dashMaquinasDetenidas", cards.maquinas_detenidas ?? 0);
    actualizarTexto("dashHorasTrabajadas", cards.horas_trabajadas ?? "0h 00m");
    actualizarTexto("dashEficiencia", `${cards.eficiencia ?? 0}%`);
}