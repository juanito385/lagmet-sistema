/* =========================
   ACTUALIZAR GRUPO ACTUAL
========================= */
function actualizarGrupoActual() {
    const grupo = document.getElementById("grupo")?.value;
    const texto = document.getElementById("grupoActualTexto");

    if (!texto) return;

    if (grupo === "1") {
        texto.innerHTML = `
            Grupo 1<br>
            12:00 → 13:00
        `;
    } else {
        texto.innerHTML = `
            Grupo 2<br>
            13:00 → 14:00
        `;
    }
}

/* =========================
   VALIDAR SOLO NÚMEROS
========================= */
function permitirSoloNumeros(id) {
    const input = document.getElementById(id);

    if (!input) return;

    input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "");
    });

    input.addEventListener("paste", (e) => {
        e.preventDefault();

        const texto = (e.clipboardData || window.clipboardData).getData("text");
        input.value = texto.replace(/\D/g, "");
    });
}

/* =========================
   SITUACIÓN / EXTRA
========================= */
function abrirModalSituacion() {
    const modal = document.getElementById("modalSituacion");

    if (!modal) {
        console.error("No existe el modal con id modalSituacion");
        return;
    }

    modal.classList.add("active");
}

function cerrarModalSituacion() {
    const modal = document.getElementById("modalSituacion");

    if (!modal) return;

    modal.classList.remove("active");
}

function guardarSituacion() {
    const horas = parseInt(document.getElementById("modalSituacionHoras")?.value) || 0;
    const minutos = parseInt(document.getElementById("modalSituacionMinutos")?.value) || 0;
    const descripcion = document.getElementById("modalSituacionDescripcion")?.value.trim() || "";

    if (horas === 0 && minutos === 0) {
        alert("Debes ingresar un tiempo extra.");
        return;
    }

    if (descripcion === "") {
        alert("Debes ingresar el motivo o descripción.");
        return;
    }

    document.getElementById("situacionHoras").value = horas;
    document.getElementById("situacionMinutos").value = minutos;
    document.getElementById("situacionDescripcion").value = descripcion;

    cerrarModalSituacion();
    calcular();
}

/* =========================
   FALLO MÁQUINA
========================= */
function mostrarSelectorMaquinaFallo() {
    const fallo = document.getElementById("falloMaquina")?.value;
    const maquinaHidden = document.getElementById("maquinaFallo");
    const maquinaCustom = document.getElementById("maquinaFalloCustom");

    if (!maquinaHidden || !maquinaCustom) return;

    if (fallo === "si") {
        maquinaCustom.style.display = "block";
    } else {
        maquinaCustom.style.display = "none";
        maquinaHidden.value = "";

        const selected = maquinaCustom.querySelector(".custom-select-selected");
        if (selected) {
            selected.innerHTML = `Seleccionar máquina <span></span>`;
        }
    }
}

/* =========================
   TABS MONITOREO
========================= */
function cambiarTabMonitoreo(tab) {
    const tabInfo = document.getElementById("tabInfoMonitoreo");
    const tabMaquinas = document.getElementById("tabMaquinasMonitoreo");
    const botones = document.querySelectorAll(".monitor-tab");

    if (!tabInfo || !tabMaquinas) return;

    tabInfo.classList.remove("active");
    tabMaquinas.classList.remove("active");

    botones.forEach(btn => btn.classList.remove("active"));

    if (tab === "info") {
        tabInfo.classList.add("active");
        botones[0]?.classList.add("active");
    }

    if (tab === "maquinas") {
        tabMaquinas.classList.add("active");
        botones[1]?.classList.add("active");
    }
}