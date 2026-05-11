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

                const btnFecha = document.getElementById("btnFechaDashboard");
                const inputFecha = document.getElementById("fechaFiltroDashboard");
                const textoFecha = document.getElementById("fechaDashboard");

                if (btnFecha) btnFecha.classList.remove("active");
                if (inputFecha) inputFecha.value = "";

                if (textoFecha) {
                    textoFecha.textContent = "--";
                    textoFecha.classList.add("fecha-oculta");
                }

                await cargarDatosDashboard(periodoDashboardActual);
        });
    });
}

function inicializarCalendarioDashboard() {
    const inputFecha = document.getElementById("fechaFiltroDashboard");
    const contenedorFecha = document.getElementById("btnFechaDashboard");
    const btnAbrirFecha = document.getElementById("abrirFechaDashboard");
    const textoFecha = document.getElementById("fechaDashboard");
    const botonesPeriodo = document.querySelectorAll(".period-btn");

    if (!inputFecha || !contenedorFecha || !btnAbrirFecha || !textoFecha) return;

    if (inputFecha.dataset.inicializado === "true") return;

    inputFecha.dataset.inicializado = "true";

    btnAbrirFecha.addEventListener("click", () => {
        if (typeof inputFecha.showPicker === "function") {
            inputFecha.showPicker();
        } else {
            inputFecha.click();
        }
    });

    inputFecha.addEventListener("change", async () => {
        const fechaSeleccionada = inputFecha.value;

        if (!fechaSeleccionada) return;

        periodoDashboardActual = "fecha";

        botonesPeriodo.forEach(btn => btn.classList.remove("active"));

        contenedorFecha.classList.add("active");
        textoFecha.classList.remove("fecha-oculta");

        cargarFechaDashboard(fechaSeleccionada);

        await cargarDatosDashboard("fecha", fechaSeleccionada);
    });
}

/* =========================
   FUNCIONES GLOBALES DASHBOARD
========================= */
window.toggleDropdownTurno = toggleDropdownTurno;
window.seleccionarFiltroTurno = seleccionarFiltroTurno;
window.cargarDashboard = cargarDashboard;
window.inicializarFiltrosDashboard = inicializarFiltrosDashboard;
window.inicializarCalendarioDashboard = inicializarCalendarioDashboard;