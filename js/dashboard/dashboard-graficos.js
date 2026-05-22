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

/* =========================
   PRODUCCIÓN SEMANAL - CHART.JS
========================= */
function cargarProduccionSemanal(semana) {
    const canvas = document.getElementById("graficoProduccionSemanal");
    if (!canvas) return;

        let datosFecha = Array.isArray(semana)
        ? semana.filter(item => item && item.tipo !== "turno" && item.fecha)
        : [];

    if (!datosFecha.length) {
        datosFecha = [
            { fecha: "Sin datos", total: 0 }
        ];
    }

    const dias = datosFecha.map(item => {
        if (item.fecha === "Sin datos") {
            return "Sin datos";
        }

        const fecha = new Date(item.fecha + "T00:00:00");

        return fecha.toLocaleDateString("es-CL", {
            weekday: "short",
            day: "2-digit"
        });
    });

const cantidades = datosFecha.map(item => item.total ?? 0);

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