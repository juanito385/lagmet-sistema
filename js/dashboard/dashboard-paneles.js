/* =========================
   RESUMEN RÁPIDO
========================= */
function cargarResumenRapido(resumen) {
    const operativas = resumen.operativas ?? 0;
    const proceso = resumen.en_proceso ?? 0;
    const detenidas = resumen.detenidas ?? 0;
    const total = resumen.total ?? 0;

    actualizarTexto("donutTotal", total);
    actualizarTexto("resumenOperativas", operativas);
    actualizarTexto("resumenProceso", proceso);
    actualizarTexto("resumenDetenidas", detenidas);

    const porcentajeOperativas = total > 0 ? Math.round((operativas / total) * 100) : 0;
    const porcentajeProceso = total > 0 ? Math.round((proceso / total) * 100) : 0;

    const donut = document.querySelector(".donut-chart");

    if (donut) {
        donut.style.background = `
            conic-gradient(
                #41c977 0% ${porcentajeOperativas}%,
                #f2a516 ${porcentajeOperativas}% ${porcentajeOperativas + porcentajeProceso}%,
                #ff4d5a ${porcentajeOperativas + porcentajeProceso}% 100%
            )
        `;
    }
}

/* =========================
   FALLAS
========================= */
function cargarFallas(fallas) {
    const panel = document.querySelector(".mini-panel.danger");
    if (!panel) return;

    panel.innerHTML = `<h3>🚨 Máquinas con más fallas</h3>`;

    if (!fallas || !fallas.length) {
        panel.innerHTML += `<p>Sin fallas registradas <span>0 fallas</span></p>`;
        return;
    }

    fallas.forEach(item => {
        panel.innerHTML += `
            <p>${item.maquina} <span>${item.total} ${item.total === 1 ? "falla" : "fallas"}</span></p>
        `;
    });
}

/* =========================
   TOP MÁQUINAS
========================= */
function cargarTopMaquinas(maquinas) {
    const paneles = document.querySelectorAll(".dashboard-mini-grid .mini-panel");
    const panel = paneles[2];

    if (!panel) return;

    panel.innerHTML = `<h3>🏆 Top máquinas</h3>`;

    if (!maquinas || !maquinas.length) {
        panel.innerHTML += `<p>Sin datos <span>0 usos</span></p>`;
        return;
    }

    maquinas.forEach(item => {
        panel.innerHTML += `
            <p>${item.maquina} <span>${item.total} usos</span></p>
        `;
    });
}

/* =========================
   TOP USUARIOS
========================= */
function cargarTopUsuarios(usuarios) {
    const paneles = document.querySelectorAll(".dashboard-mini-grid .mini-panel");
    const panel = paneles[3];

    if (!panel) return;

    panel.innerHTML = `<h3>👤 Top usuarios</h3>`;

    if (!usuarios || !usuarios.length) {
        panel.innerHTML += `<p>Sin usuarios <span>0 piezas</span></p>`;
        return;
    }

    usuarios.forEach(item => {
        panel.innerHTML += `
            <p>${item.usuario} <span>${item.total} piezas</span></p>
        `;
    });
}

/* =========================
   TIEMPO DETENIDO
========================= */
function cargarTiempoDetenido(tiempo) {
    actualizarTexto("tiempoDetenido", tiempo?.total ?? "0h 00m");
    actualizarTexto("promedioDetenido", tiempo?.promedio ?? "0h 00m");
}

/* =========================
   ESTADO PRODUCCIÓN
========================= */
function cargarEstadoProduccion(estado) {
    const ok = document.querySelector(".status-boxes .ok strong");
    const process = document.querySelector(".status-boxes .process strong");
    const late = document.querySelector(".status-boxes .late strong");

    if (ok) ok.textContent = estado.completados ?? 0;
    if (process) process.textContent = estado.en_proceso ?? 0;
    if (late) late.textContent = estado.atrasados ?? 0;
}