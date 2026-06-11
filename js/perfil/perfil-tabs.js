/* =========================
   PERFIL - TABS INTERNOS
========================= */

document.addEventListener("click", function (e) {
    const tab = e.target.closest(".perfil-tab");

    if (!tab) return;

    const perfilSection = tab.closest(".perfil-section");

    if (!perfilSection) return;

    const tabSeleccionado = tab.dataset.perfilTab;

    const tabs = perfilSection.querySelectorAll(".perfil-tab");
    const panels = perfilSection.querySelectorAll(".perfil-tab-panel");

    tabs.forEach(item => item.classList.remove("active"));
    panels.forEach(panel => panel.classList.remove("active"));

    tab.classList.add("active");

    const panelActivo = perfilSection.querySelector(
        `.perfil-tab-panel[data-perfil-panel="${tabSeleccionado}"]`
    );

    if (panelActivo) {
        panelActivo.classList.add("active");
    }
});
