/* =========================
   FORMATO HORA AM/PM
========================= */
function formatearHoraAMPM(fecha) {
    return fecha.toLocaleTimeString("es-CL", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    }).toUpperCase();
}

/* =========================
   CÁLCULO
========================= */
function calcular() {
    let total = 0;

    const filas = document.querySelectorAll("#tablaMaquinas tbody tr");

    filas.forEach(fila => {
        const uso = fila.querySelector(".uso");
        const h = fila.querySelector(".horas");
        const m = fila.querySelector(".minutos");

        if (uso && h && m && uso.value === "si") {
            total += parseFloat(h.value) + (parseInt(m.value) / 60);
        }
    });

    const cantidad = parseInt(document.getElementById("cantidadProductos")?.value) || 1;
    total *= cantidad;

    const situacionHoras = parseInt(document.getElementById("situacionHoras")?.value) || 0;
    const situacionMinutos = parseInt(document.getElementById("situacionMinutos")?.value) || 0;

    total += situacionHoras + (situacionMinutos / 60);

    const salidaEl = document.getElementById("salida");
    const diasEl = document.getElementById("dias");
    const grupo = document.getElementById("grupo")?.value;
    const trabajaSabado = document.getElementById("trabajaSabado")?.value || "no";
    const fechaInicioInput = document.getElementById("fecha")?.value;

    if (!salidaEl || !diasEl) return;

    if (total === 0 || !fechaInicioInput) {
        salidaEl.textContent = "--";
        diasEl.value = "";

        const fechaFinInput = document.getElementById("fechaFin");
        const fechaFinVisual = document.getElementById("fechaFinVisual");

        if (fechaFinInput) fechaFinInput.value = "";
        if (fechaFinVisual) fechaFinVisual.value = "";

        return;
    }

    let ahora = new Date(fechaInicioInput + "T00:00:00");
    ahora.setHours(inicioJornadaHora, inicioJornadaMin, 0, 0);

    let restante = total;
    let dias = 1;

    const almInicio = grupo === "1" ? 12 : 13;
    const almFin = grupo === "1" ? 13 : 14;

    while (restante > 0) {
        const diaSemana = ahora.getDay();

        if (diaSemana === 0 || (diaSemana === 6 && trabajaSabado === "no")) {
            ahora.setDate(ahora.getDate() + 1);
            ahora.setHours(inicioJornadaHora, inicioJornadaMin, 0, 0);
            dias++;
            continue;
        }

        let actual = ahora.getHours() + (ahora.getMinutes() / 60);
        let finJornada = finJornadaHora + (finJornadaMin / 60);

        if (actual >= almInicio && actual < almFin) {
            ahora.setHours(almFin, 0, 0, 0);
            continue;
        }

        if (actual >= finJornada) {
            ahora.setDate(ahora.getDate() + 1);
            ahora.setHours(inicioJornadaHora, inicioJornadaMin, 0, 0);
            dias++;
            continue;
        }

        let tramo = actual < almInicio
            ? Math.min(finJornada, almInicio) - actual
            : finJornada - actual;

        if (restante <= tramo) {
            ahora = new Date(ahora.getTime() + restante * 3600000);
            restante = 0;
        } else {
            ahora = new Date(ahora.getTime() + tramo * 3600000);
            restante -= tramo;
        }
    }

    const horaFormateada = formatearHoraAMPM(ahora);

    const fechaFinInput = document.getElementById("fechaFin");
    const fechaFinVisual = document.getElementById("fechaFinVisual");

    const fechaFinISO = ahora.toISOString().split("T")[0];

    if (fechaFinInput) {
        fechaFinInput.value = fechaFinISO;
    }

    if (fechaFinVisual) {
        const dia = String(ahora.getDate()).padStart(2, "0");
        const mes = String(ahora.getMonth() + 1).padStart(2, "0");
        const anio = ahora.getFullYear();

        fechaFinVisual.value = `${dia}/${mes}/${anio}`;
    }

    salidaEl.textContent =
        `${Math.floor(total)}h ${Math.round((total % 1) * 60)}m → ${horaFormateada}`;

    diasEl.value = dias;
}