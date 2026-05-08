/* =========================
   CLICK GENERAL MONITOREO
========================= */
document.addEventListener("click", e => {

    const zonaBtn = e.target.closest(".zona-btn");

    if (zonaBtn) {
        document.querySelectorAll(".zona-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        zonaBtn.classList.add("active");
        filtroZonaActual = zonaBtn.dataset.zona || "todas";

        aplicarFiltrosMaquinas();
        return;
    }

    const selectedBtn = e.target.closest(".custom-select-selected");
    const optionBtn = e.target.closest(".custom-select-options button");

    if (!selectedBtn && !optionBtn) {
        document.querySelectorAll(".custom-select-options").forEach(menu => {
            menu.classList.remove("active");
        });

        document.querySelectorAll(".custom-select-selected").forEach(btn => {
            btn.classList.remove("active");
        });

        return;
    }

    if (selectedBtn) {
        const wrapper = selectedBtn.closest(".custom-select-monitor");
        const options = wrapper?.querySelector(".custom-select-options");

        if (!wrapper || !options) return;

        document.querySelectorAll(".custom-select-options").forEach(menu => {
            if (menu !== options) menu.classList.remove("active");
        });

        document.querySelectorAll(".custom-select-selected").forEach(btn => {
            if (btn !== selectedBtn) btn.classList.remove("active");
        });

        selectedBtn.classList.toggle("active");
        options.classList.toggle("active");

        return;
    }

    if (optionBtn) {
        const wrapper = optionBtn.closest(".custom-select-monitor");
        const selected = wrapper.querySelector(".custom-select-selected");

        let targetInput = null;

        if (wrapper.dataset.target) {
            targetInput = document.getElementById(wrapper.dataset.target);
        }

        if (wrapper.dataset.targetClass) {
            const fila = wrapper.closest("tr");
            targetInput = fila?.querySelector(`.${wrapper.dataset.targetClass}`);
        }

        if (!targetInput) return;

        targetInput.value = optionBtn.dataset.value;
        selected.innerHTML = `${optionBtn.textContent} <span class="select-circle-icon"></span>`;

        wrapper.querySelector(".custom-select-options").classList.remove("active");
        selected.classList.remove("active");

        const fila = wrapper.closest("tr");

        if (fila) {
            actualizarColorFila(fila);
        }

        calcular();
        actualizarGrupoActual();
        aplicarFiltrosMaquinas();

        if (wrapper.dataset.onchange === "mostrarSelectorMaquinaFallo") {
            mostrarSelectorMaquinaFallo();
        }
    }
});

/* =========================
   CHANGE GENERAL MONITOREO
========================= */
document.addEventListener("change", e => {
    const target = e.target;

    if (
        target.classList.contains("uso") ||
        target.classList.contains("horas") ||
        target.classList.contains("minutos") ||
        ["grupo", "trabajaSabado", "cantidadProductos", "fecha", "filtroUsoMaquinas"].includes(target.id)
    ) {
        const fila = target.closest("tr");

        if (fila) {
            actualizarColorFila(fila);
        }

        calcular();
        aplicarFiltrosMaquinas();

        if (typeof cargarEstadoMaquinasDashboard === "function") {
            cargarEstadoMaquinasDashboard();
        }
    }
});

/* =========================
   INPUT GENERAL MONITOREO
========================= */
document.addEventListener("input", e => {
    if (e.target.id === "cantidadProductos") {
        calcular();
    }

    if (e.target.id === "buscarMaquina") {
        aplicarFiltrosMaquinas();
    }
});