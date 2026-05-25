/* =========================
   PRODUCCIÓN POR TURNO
========================= */
function cargarTurnos(turnos) {
    const manana = Number(turnos.manana ?? 0);
    const tarde = Number(turnos.tarde ?? 0);
    const noche = Number(turnos.noche ?? 0);

    const total = Number(turnos.total_hoy ?? 0);
    const meta = Number(turnos.meta ?? 0);

    const max = Math.max(manana, tarde, noche, 1);

    actualizarTexto("turnoMananaNumero", `${manana} piezas`);
    actualizarTexto("turnoTardeNumero", `${tarde} piezas`);
    actualizarTexto("turnoNocheNumero", `${noche} piezas`);

    actualizarBarraTurno("turnoMananaBarra", (manana / max) * 100, manana);
    actualizarBarraTurno("turnoTardeBarra", (tarde / max) * 100, tarde);
    actualizarBarraTurno("turnoNocheBarra", (noche / max) * 100, noche);

    actualizarTexto("totalProducidoHoy", `${total} piezas`);
    actualizarTexto("metaDiaria", `${meta}%`);

    actualizarResumenTurnos({
        manana,
        tarde,
        noche,
        total
    });
}

function actualizarResumenTurnos(datos) {
    const manana = datos.manana;
    const tarde = datos.tarde;
    const noche = datos.noche;
    const total = datos.total;

    const filtroActual = document.getElementById("textoFiltroTurno")?.textContent?.trim() || "Hoy";

    const titulo = document.getElementById("tituloResumenTurnos");
    const descripcion = document.getElementById("descripcionResumenTurnos");
    const icono = document.getElementById("iconoTextoTurnos");

    if (!titulo || !descripcion || !icono) return;

    const periodoTexto = obtenerTextoPeriodoTurno(filtroActual);

    if (total <= 0) {
        titulo.textContent = `Sin producción registrada ${periodoTexto.vacio}`;
        descripcion.textContent = `Aún no hay registros en los turnos. Cuando se registren, verás el resumen aquí.`;
        icono.textContent = "assignment";
        return;
    }

    const turnosOrdenados = [
        { nombre: "Mañana", valor: manana },
        { nombre: "Tarde", valor: tarde },
        { nombre: "Noche", valor: noche }
    ].sort((a, b) => b.valor - a.valor);

    const lider = turnosOrdenados[0];
    const segundo = turnosOrdenados[1];

    titulo.textContent = `Resumen ${periodoTexto.resumen}`;

    if (lider.valor > 0 && segundo.valor > 0) {
        descripcion.textContent = `Se registraron ${total} piezas ${periodoTexto.registro}. El turno ${lider.nombre} lidera la producción, seguido por ${segundo.nombre}.`;
    } else if (lider.valor > 0) {
        descripcion.textContent = `Se registraron ${total} piezas ${periodoTexto.registro}. El turno ${lider.nombre} concentra toda la producción registrada.`;
    } else {
        descripcion.textContent = `Se registraron ${total} piezas ${periodoTexto.registro}.`;
    }

    icono.textContent = "event_note";
}

function obtenerTextoPeriodoTurno(filtro) {
    const valor = filtro.toLowerCase();

    if (valor.includes("semana")) {
        return {
            resumen: "de la semana",
            registro: "esta semana",
            vacio: "esta semana"
        };
    }

    if (valor.includes("mes")) {
        return {
            resumen: "del mes",
            registro: "en el mes actual",
            vacio: "este mes"
        };
    }

    return {
        resumen: "de hoy",
        registro: "durante el día",
        vacio: "hoy"
    };
}

function actualizarBarraTurno(id, porcentaje, valor) {
    const barra = document.getElementById(id);
    if (!barra) return;

    const porcentajeFinal = Math.max(0, Math.min(porcentaje, 100));

    barra.style.width = `${porcentajeFinal}%`;
    barra.style.height = "100%";

    if (Number(valor) <= 0) {
        barra.style.opacity = "0";
    } else {
        barra.style.opacity = "1";
    }
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

    const hayDatosReales = datosFecha.some(item => item.fecha !== "Sin datos" && Number(item.total) > 0);

    actualizarEstadoVacioProduccion(hayDatosReales);

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

/* =========================
   ESTADO VACÍO GRÁFICO SEMANAL
========================= */
function actualizarEstadoVacioProduccion(hayDatos) {
    const estadoVacio = document.getElementById("estadoVacioProduccion");

    if (!estadoVacio) return;

    if (hayDatos) {
        estadoVacio.classList.remove("active");
    } else {
        estadoVacio.classList.add("active");
    }
}