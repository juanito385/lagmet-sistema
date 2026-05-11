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

        if (btn.dataset.inicializado === "true") return;

        btn.dataset.inicializado = "true";

        btn.addEventListener("click", async () => {
            const periodo = btn.dataset.periodo || "hoy";

            periodoDashboardActual = periodo;

            botones.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            await cargarDatosDashboard(periodoDashboardActual);
        });
    });
}

document.addEventListener("click", function(e) {
    const btnFecha = document.getElementById("btnFechaDashboard");

    if (!btnFecha) return;

    if (btnFecha.contains(e.target)) {
        btnFecha.classList.toggle("activa");
    } else {
        btnFecha.classList.remove("activa");
    }
});

/* =========================
   FUNCIONES GLOBALES DASHBOARD
========================= */
window.toggleDropdownTurno = toggleDropdownTurno;
window.seleccionarFiltroTurno = seleccionarFiltroTurno;
window.cargarDashboard = cargarDashboard;
window.inicializarFiltrosDashboard = inicializarFiltrosDashboard;