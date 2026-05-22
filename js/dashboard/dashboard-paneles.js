
/* =========================
   RESUMEN RÁPIDO / DISTRIBUCIÓN OPERATIVA
========================= */
function cargarResumenRapido(resumen) {
    const operativas = Number(resumen.operativas ?? 0);
    const proceso = Number(resumen.en_proceso ?? 0);
    const detenidas = Number(resumen.detenidas ?? 0);

    const totalCalculado = operativas + proceso + detenidas;
    const total = totalCalculado > 0 ? totalCalculado : Number(resumen.total ?? 0);

    const porcentajeOperativas = total > 0 ? (operativas / total) * 100 : 0;
    const porcentajeProceso = total > 0 ? (proceso / total) * 100 : 0;
    const porcentajeDetenidas = total > 0 ? (detenidas / total) * 100 : 0;

    actualizarTexto("donutTotal", total);

    actualizarTexto("resumenOperativas", operativas);
    actualizarTexto("resumenProceso", proceso);
    actualizarTexto("resumenDetenidas", detenidas);

    actualizarTexto("porcentajeOperativas", `${porcentajeOperativas.toFixed(1)}%`);
    actualizarTexto("porcentajeProceso", `${porcentajeProceso.toFixed(1)}%`);
    actualizarTexto("porcentajeDetenidas", `${porcentajeDetenidas.toFixed(1)}%`);

    actualizarTexto("cardOperativasPercent", `${porcentajeOperativas.toFixed(1)}%`);
    actualizarTexto("cardProcesoPercent", `${porcentajeProceso.toFixed(1)}%`);
    actualizarTexto("cardDetenidasPercent", `${porcentajeDetenidas.toFixed(1)}%`);

    const donut = document.getElementById("donutChart");

    if (donut) {
        if (total > 0) {
            const finOperativas = porcentajeOperativas;
            const finProceso = porcentajeOperativas + porcentajeProceso;

            donut.style.background = `
                conic-gradient(
                    from 70deg,
                    #22c55e 0% ${finOperativas}%,
                    #f59e0b ${finOperativas}% ${finProceso}%,
                    #ef4444 ${finProceso}% 100%
                )
            `;
        } else {
            donut.style.background = `conic-gradient(rgba(255,255,255,.10) 0% 100%)`;
        }
    }

    requestAnimationFrame(() => {
        posicionarPorcentajesDonut([
            {
                id: "labelOperativas",
                valor: operativas,
                offsetX: -6,
                offsetY: -8
            },
            {
                id: "labelProceso",
                valor: proceso,
                offsetX: 10,
                offsetY: -10
            },
            {
                id: "labelDetenidas",
                valor: detenidas,
                offsetX: 8,
                offsetY: 4
            }
        ]);
    });
}

/* =========================
   PORCENTAJES DINÁMICOS DONUT
   Sin líneas, solo porcentaje junto al segmento
========================= */
function posicionarPorcentajesDonut(segmentos) {
    const area = document.getElementById("donutArea");
    const donut = document.getElementById("donutChart");

    if (!area || !donut) return;

    const areaRect = area.getBoundingClientRect();
    const donutRect = donut.getBoundingClientRect();

    const centroX = donutRect.left - areaRect.left + donutRect.width / 2;
    const centroY = donutRect.top - areaRect.top + donutRect.height / 2;
    const radio = donutRect.width / 2;

    const total = segmentos.reduce((acc, item) => acc + item.valor, 0);

    if (total <= 0) {
        segmentos.forEach(item => {
            const label = document.getElementById(item.id);
            if (label) label.style.display = "none";
        });
        return;
    }

    /*
        Debe coincidir con:
        conic-gradient(from 70deg, ...)
    */
    let anguloActual = 70;

    segmentos.forEach(item => {
        const label = document.getElementById(item.id);
        if (!label) return;

        if (item.valor <= 0) {
            label.style.display = "none";
            return;
        }

        label.style.display = "flex";

        const gradosSegmento = (item.valor / total) * 360;
        const anguloMedio = anguloActual + gradosSegmento / 2;
        const radianes = (anguloMedio - 90) * Math.PI / 180;

        /*
            radio + 32 = porcentaje fuera del gráfico.
            Si lo quieres más lejos, sube a 38 o 44.
        */
        let labelX = centroX + Math.cos(radianes) * (radio + 32) + (item.offsetX || 0);
        let labelY = centroY + Math.sin(radianes) * (radio + 32) + (item.offsetY || 0);

        labelX = limitar(labelX, 38, areaRect.width - 38);
        labelY = limitar(labelY, 28, areaRect.height - 28);

        label.style.left = `${labelX}px`;
        label.style.top = `${labelY}px`;
        label.style.transform = "translate(-50%, -50%)";

        anguloActual += gradosSegmento;
    });
}

function limitar(valor, minimo, maximo) {
    return Math.min(Math.max(valor, minimo), maximo);
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