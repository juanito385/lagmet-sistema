/* =========================
   DASHBOARD LAGMET
========================= */

let periodoDashboardActual = "hoy";

async function cargarDashboard() {
    cargarFechaDashboard();
    await cargarDatosDashboard(periodoDashboardActual);
}

/* =========================
   FECHA DASHBOARD
========================= */
function cargarFechaDashboard(){
    const fecha = new Date();

    const opciones = {
        day: "2-digit",
        month: "long",
        year: "numeric"
    };

    const fechaTexto = fecha.toLocaleDateString("es-CL", opciones);
    actualizarTexto("fechaDashboard", fechaTexto);
}

/* =========================
   DATOS DESDE BD
========================= */
async function cargarDatosDashboard(periodo = "hoy") {
    try {
        const response = await fetch(`php/obtener_dashboard.php?periodo=${periodo}`);
        const data = await response.json();

        console.log("DASHBOARD DATA:", data);

        if (!data.success) {
            console.error("Error dashboard:", data.message);
            return;
        }

        cargarCards(data.cards);
        cargarTurnos(data.turnos);
        cargarComparacion(data.comparacion);
        cargarProduccionSemanal(data.semana);
        cargarResumenRapido(data.resumen);
        cargarTiempoDetenido(data.tiempo_detenido); // 👈 AQUÍ
        cargarFallas(data.fallas);
        cargarTopMaquinas(data.top_maquinas);
        cargarTopUsuarios(data.top_usuarios);
        cargarEstadoProduccion(data.estado_produccion);
        cargarUltimosRegistros(data.ultimos_registros);

    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
}

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

/* =========================
   PRODUCCIÓN POR TURNO
========================= */
function cargarTurnos(turnos) {
    const manana = turnos.manana ?? 0;
    const tarde = turnos.tarde ?? 0;
    const noche = turnos.noche ?? 0;

    const max = Math.max(manana, tarde, noche, 1);

    actualizarTexto("turnoMananaNumero", manana);
    actualizarTexto("turnoTardeNumero", tarde);
    actualizarTexto("turnoNocheNumero", noche);

    actualizarAltura("turnoMananaBarra", (manana / max) * 100);
    actualizarAltura("turnoTardeBarra", (tarde / max) * 100);
    actualizarAltura("turnoNocheBarra", (noche / max) * 100);

    actualizarTexto("totalProducidoHoy", `${turnos.total_hoy ?? 0} piezas`);
    actualizarTexto("metaDiaria", `${turnos.meta ?? 0}%`);
}

/* =========================
   COMPARACIÓN HOY VS AYER
========================= */
function cargarComparacion(comparacion) {
    const hoy = comparacion.hoy ?? 0;
    const ayer = comparacion.ayer ?? 0;

    actualizarTexto("produccionHoy", `${hoy} piezas`);
    actualizarTexto("produccionAyer", `${ayer} piezas`);

    const lineaHoy = document.querySelector(".line-today");
    const lineaAyer = document.querySelector(".line-yesterday");

    if (!lineaHoy || !lineaAyer) return;

    const max = Math.max(hoy, ayer, 1);

    const escalaHoy = hoy / max;
    const escalaAyer = ayer / max;

    lineaHoy.style.transform = `scaleY(${Math.max(escalaHoy, 0.05)})`;
    lineaAyer.style.transform = `scaleY(${Math.max(escalaAyer, 0.15)})`;

    lineaHoy.style.opacity = hoy > 0 ? "1" : "0.25";
    lineaAyer.style.opacity = ayer > 0 ? "0.75" : "0.25";
}

let graficoProduccionSemanal = null;

/* =========================
   PRODUCCIÓN SEMANAL - CHART.JS
========================= */
function cargarProduccionSemanal(semana) {
    const canvas = document.getElementById("graficoProduccionSemanal");
    if (!canvas) return;

    if (!semana || !semana.length) {
        return;
    }

    const dias = semana.map(item => {
        const fecha = new Date(item.fecha + "T00:00:00");

        return fecha.toLocaleDateString("es-CL", {
            weekday: "short",
            day: "2-digit"
        });
    });

    const cantidades = semana.map(item => item.total);

    if (graficoProduccionSemanal) {
        graficoProduccionSemanal.destroy();
    }

    graficoProduccionSemanal = new Chart(canvas, {
        type: "line",
        data: {
            labels: dias,
            datasets: [
                {
                    label: "Piezas producidas",
                    data: cantidades,
                    tension: 0.45,
                    fill: true,
                    borderWidth: 4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    borderColor: "#9b5cff",
                    backgroundColor: "rgba(155, 92, 255, 0.18)",
                    pointBackgroundColor: "#ffffff",
                    pointBorderColor: "#9b5cff",
                    pointBorderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: "#1f2235",
                    titleColor: "#ffffff",
                    bodyColor: "#ffffff",
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.raw} piezas`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: "#ffffff",
                        font: {
                            size: 12,
                            weight: "bold"
                        }
                    },
                    grid: {
                        color: "rgba(255,255,255,0.06)"
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#cfd3e6",
                        precision: 0
                    },
                    grid: {
                        color: "rgba(255,255,255,0.08)"
                    }
                }
            }
        }
    });
}

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
    const porcentajeDetenidas = total > 0 ? Math.round((detenidas / total) * 100) : 0;

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

/* =========================
   ÚLTIMOS REGISTROS
========================= */
function cargarUltimosRegistros(registros) {
    const tbody = document.getElementById("tablaUltimosRegistros");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!registros || !registros.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">No hay registros disponibles</td>
            </tr>
        `;
        return;
    }

    registros.forEach(item => {
        const fila = document.createElement("tr");

            fila.innerHTML = `
        <td>#${item.id ?? ""}</td>
        <td>${item.producto ?? ""}</td>
        <td>${formatearMaquinas(item.maquinas_usadas)}</td>
        <td>${item.turno ?? "Sin turno"}</td>
        <td><span class="badge-blue">${item.cantidad ?? 0} piezas</span></td>
        <td>${formatearFecha(item.fecha)}</td>
        <td>${item.usuario ?? "Admin"}</td>
    `;
        tbody.appendChild(fila);
    });
}

/* =========================
   UTILIDADES
========================= */
function actualizarTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
    
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


function actualizarAltura(id, porcentaje) {
    const elemento = document.getElementById(id);

    if (elemento) {
        const altura = Math.max(12, Math.min(porcentaje, 100));
        elemento.style.height = `${altura}%`;
    }
}

/* =========================
   DROPDOWN TURNO DASHBOARD
========================= */
function toggleDropdownTurno(){
    const menu = document.getElementById("menuFiltroTurno");
    if(menu){
        menu.classList.toggle("active");
    }
}

function seleccionarFiltroTurno(valor){
    const texto = document.getElementById("textoFiltroTurno");
    const menu = document.getElementById("menuFiltroTurno");

    if(texto){
        texto.textContent = valor;
    }

    if(menu){
        menu.classList.remove("active");
    }

    let periodo = "hoy";

    if (valor === "Semana") periodo = "semana";
    if (valor === "Mes") periodo = "mes";

    cargarDatosDashboard(periodo);
}

document.addEventListener("click", function(e){
    const dropdown = document.getElementById("dropdownTurno");

    if(dropdown && !dropdown.contains(e.target)){
        const menu = document.getElementById("menuFiltroTurno");
        if(menu){
            menu.classList.remove("active");
        }
    }
});

/* =========================
   FILTROS SUPERIORES DASHBOARD
========================= */
function inicializarFiltrosDashboard() {
    const botones = document.querySelectorAll(".period-btn");

    if (!botones.length) return;

    botones.forEach(btn => {
        btn.addEventListener("click", async () => {
            const periodo = btn.dataset.periodo || "hoy";

            periodoDashboardActual = periodo;

            botones.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            await cargarDatosDashboard(periodoDashboardActual);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarFiltrosDashboard();
});