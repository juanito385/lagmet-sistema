/* =========================
   CARDS SUPERIORES
========================= */
function cargarCards(cards) {
    actualizarTexto("dashTotalProductos", cards.total_productos ?? 0);
    actualizarTexto("dashTotalProductosTexto", cards.total_productos_texto ?? "Registrados en el sistema");
    actualizarTexto("dashTotalProductosDetalle", cards.total_productos_detalle ?? "");

    actualizarTexto("dashProductosProceso", cards.productos_proceso ?? 0);
    actualizarTexto("dashProductosProcesoTexto", cards.productos_proceso_texto ?? "Producción activa actualmente");
    actualizarTexto("dashProductosProcesoDetalle", cards.productos_proceso_detalle ?? "Según fecha estimada de término");

    actualizarTexto("dashMaquinasOperativas", cards.maquinas_operativas ?? 0);
    actualizarTexto("dashMaquinasDetenidas", cards.maquinas_detenidas ?? 0);

    actualizarTexto(
        "dashMaquinasOperativasDetalle",
        `${cards.porcentaje_operativas ?? 0}% del total`
    );

    actualizarTexto(
        "dashMaquinasDetenidasDetalle",
        `${cards.porcentaje_detenidas ?? 0}% del total`
    );

    actualizarTexto("dashHorasTrabajadas", cards.horas_trabajadas ?? "0h 00m");
    actualizarTexto("dashHorasTrabajadasTexto", cards.horas_trabajadas_texto ?? "Tiempo trabajado hoy");
    actualizarTexto("dashHorasTrabajadasDetalle", cards.horas_trabajadas_detalle ?? "Según máquinas utilizadas");

    actualizarTexto("dashEficiencia", `${cards.eficiencia ?? 0}%`);
    actualizarTexto("dashEficienciaTexto", cards.eficiencia_texto ?? "Producción vs meta diaria");
    actualizarTexto("dashEficienciaDetalle", cards.eficiencia_detalle ?? "Meta diaria: 100 piezas");

    renderListaMaquinasDashboard("operativas", cards.lista_maquinas_operativas ?? []);
    renderListaMaquinasDashboard("detenidas", cards.lista_maquinas_detenidas ?? []);
}

/* =========================
   LISTAS DE MÁQUINAS EN CARDS
========================= */
function renderListaMaquinasDashboard(tipo, maquinas) {
    const esOperativa = tipo === "operativas";

    const contenedor = document.getElementById(
        esOperativa ? "listaMaquinasOperativas" : "listaMaquinasDetenidas"
    );

    const titulo = document.getElementById(
        esOperativa ? "tituloMaquinasOperativas" : "tituloMaquinasDetenidas"
    );

    if (!contenedor) return;

    if (titulo) {
        titulo.textContent = `(${maquinas.length})`;
    }

    if (!maquinas.length) {
        contenedor.innerHTML = `
            <p class="maquinas-empty">
                ${esOperativa ? "Sin máquinas operativas" : "Sin máquinas detenidas"}
            </p>
        `;
        return;
    }

    contenedor.innerHTML = maquinas.map(maquina => {
        const nombre = maquina.nombre_maquina || "Sin nombre";
        const zona = maquina.zona || "Sin zona";
        const estado = esOperativa ? "Operativa" : "Detenida";
        const claseEstado = esOperativa ? "estado-operativa" : "estado-detenida";

        return `
            <div class="maquina-row-card">
                <strong>${nombre}</strong>
                <span>${zona}</span>
                <span class="estado-maquina-card ${claseEstado}">
                    ${estado}
                </span>
            </div>
        `;
    }).join("");
}

/* =========================
   ABRIR / CERRAR DROPDOWN
========================= */
function toggleMaquinasDropdown(tipo) {
    const cardOperativas = document.getElementById("cardMaquinasOperativas");
    const cardDetenidas = document.getElementById("cardMaquinasDetenidas");

    const cardActual = tipo === "operativas" ? cardOperativas : cardDetenidas;
    const cardOtra = tipo === "operativas" ? cardDetenidas : cardOperativas;

    if (!cardActual) return;

    if (cardOtra) {
        cardOtra.classList.remove("active");
    }

    cardActual.classList.toggle("active");
}

document.addEventListener("click", function(e) {
    const cardOperativas = document.getElementById("cardMaquinasOperativas");
    const cardDetenidas = document.getElementById("cardMaquinasDetenidas");

    const clickDentroOperativas = cardOperativas && cardOperativas.contains(e.target);
    const clickDentroDetenidas = cardDetenidas && cardDetenidas.contains(e.target);

    if (!clickDentroOperativas && !clickDentroDetenidas) {
        if (cardOperativas) cardOperativas.classList.remove("active");
        if (cardDetenidas) cardDetenidas.classList.remove("active");
    }
});

window.toggleMaquinasDropdown = toggleMaquinasDropdown;