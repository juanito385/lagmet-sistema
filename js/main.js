window.addEventListener("DOMContentLoaded", () => {

    iniciarApp();

    // Cargar dashboard cuando ya exista el HTML y las tablas de máquinas
    setTimeout(() => {
        if (typeof cargarDashboard === "function") {
            cargarDashboard();
        }
    }, 300);

});