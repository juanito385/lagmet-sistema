/* =========================
   UTILIDADES DASHBOARD
========================= */
function actualizarTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
}

function actualizarAltura(id, porcentaje) {
    const elemento = document.getElementById(id);

    if (elemento) {
        const altura = Math.max(12, Math.min(porcentaje, 100));
        elemento.style.height = `${altura}%`;
    }
}

function formatearFecha(fecha) {
    if (!fecha) return "";

    const partes = fecha.split("-");
    if (partes.length !== 3) return fecha;

    const f = new Date(partes[0], partes[1] - 1, partes[2]);

    return f.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

function formatearMaquinas(maquinas) {
    if (!maquinas || maquinas === "Sin máquina") {
        return "Sin máquina";
    }

    const lista = maquinas.split(",").map(m => m.trim()).filter(Boolean);

    if (lista.length <= 1) {
        return lista[0];
    }

    const primera = lista[0];
    const completo = lista.map(m => `<li>${m}</li>`).join("");

    return `
        <div class="maquina-tooltip-wrap">
            <span class="maquina-corta">${primera}...</span>
            <button class="btn-maquinas-info" type="button">...</button>

            <div class="maquina-tooltip">
                <strong>Máquinas utilizadas:</strong>
                <ul>${completo}</ul>
            </div>
        </div>
    `;
}
