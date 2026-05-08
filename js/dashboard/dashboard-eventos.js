/* =========================
   DROPDOWN TURNO DASHBOARD
========================= */
function toggleDropdownTurno() {
    const menu = document.getElementById("menuFiltroTurno");

    if (menu) {
        menu.classList.toggle("active");
    }
}

function seleccionarFiltroTurno(valor) {
    const texto = document.getElementById("textoFiltroTurno");
    const menu = document.getElementById("menuFiltroTurno");

    if (texto) {
        texto.textContent = valor;
    }

    if (menu) {
        menu.classList.remove("active");
    }

    let periodo = "hoy";

    if (valor === "Semana") periodo = "semana";
    if (valor === "Mes") periodo = "mes";

    cargarDatosDashboard(periodo);
}

document.addEventListener("click", function(e) {
    const dropdown = document.getElementById("dropdownTurno");

    if (dropdown && !dropdown.contains(e.target)) {
        const menu = document.getElementById("menuFiltroTurno");

        if (menu) {
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

/* =========================
   FUNCIONES GLOBALES DASHBOARD
========================= */
window.toggleDropdownTurno = toggleDropdownTurno;
window.seleccionarFiltroTurno = seleccionarFiltroTurno;
window.cargarDashboard = cargarDashboard;
window.inicializarFiltrosDashboard = inicializarFiltrosDashboard;