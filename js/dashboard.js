/* =========================
   DASHBOARD LAGMET
========================= */

async function cargarDashboard() {
    cargarFechaDashboard();
    await cargarDatosDashboard();
    await cargarEstadoMaquinasDashboard(); // 🔥 ahora espera datos reales
}

/* =========================
   FECHA DASHBOARD
========================= */
function cargarFechaDashboard(){
    const fecha = new Date();

    const opciones = {
        day:"2-digit",
        month:"long",
        year:"numeric"
    };

    const fechaTexto = fecha.toLocaleDateString("es-CL", opciones);
    const fechaDashboard = document.getElementById("fechaDashboard");

    if(fechaDashboard){
        fechaDashboard.textContent = fechaTexto;
    }
}

/* =========================
   DATOS DESDE BD
========================= */
async function cargarDatosDashboard() {
    try {
        const response = await fetch("php/obtener_produccion.php");
        const data = await response.json();

        if (!data.success || !Array.isArray(data.data)) return;

        const registros = data.data;

        const totalProductos = registros.length;

        const productosProceso = registros.filter(item => {
            return item.fecha && item.fecha !== "";
        }).length;

        const totalCantidad = registros.reduce((total, item) => {
            return total + (parseInt(item.cantidad) || 0);
        }, 0);

        actualizarTexto("dashTotalProductos", totalProductos);
        actualizarTexto("dashProductosProceso", productosProceso);

        cargarUltimosRegistros(registros);
        cargarProductividadTurno(totalCantidad);

    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
}

/* =========================
   ÚLTIMOS REGISTROS
========================= */
function cargarUltimosRegistros(registros) {
    const tbody = document.getElementById("tablaUltimosRegistros");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!registros.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">No hay registros disponibles</td>
            </tr>
        `;
        return;
    }

    registros.slice(0, 5).forEach(item => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>#${item.id ?? ""}</td>
            <td>${item.producto ?? ""}</td>
            <td>${item.codigo ?? "Sin código"}</td>
            <td>${item.numero_pedido ?? "Sin pedido"}</td>
            <td><span class="badge-blue">${item.cantidad ?? 0} piezas</span></td>
            <td>${item.fecha ?? ""}</td>
            <td>Admin</td>
        `;

        tbody.appendChild(fila);
    });
}

/* =========================
   PRODUCTIVIDAD POR TURNO
========================= */
function cargarProductividadTurno(totalCantidad) {
    const manana = Math.round(totalCantidad * 0.45);
    const tarde = Math.round(totalCantidad * 0.35);
    const noche = Math.round(totalCantidad * 0.20);

    const max = Math.max(manana, tarde, noche, 1);

    actualizarTexto("turnoMananaNumero", manana);
    actualizarTexto("turnoTardeNumero", tarde);
    actualizarTexto("turnoNocheNumero", noche);

    actualizarAltura("turnoMananaBarra", (manana / max) * 100);
    actualizarAltura("turnoTardeBarra", (tarde / max) * 100);
    actualizarAltura("turnoNocheBarra", (noche / max) * 100);
}

/* =========================
   ESTADO DE MÁQUINAS (BD REAL)
========================= */
async function cargarEstadoMaquinasDashboard() {
    try {
        const response = await fetch("php/estado_maquinas.php");
        const data = await response.json();

        if (!data.success || !Array.isArray(data.data)) return;

        const maquinas = data.data;

        const operativas = maquinas.filter(m => m.estado === "Si").length;
        const detenidas = maquinas.filter(m => m.estado !== "Si").length;

        const total = operativas + detenidas;
        const porcentaje = total > 0 ? Math.round((operativas / total) * 100) : 0;

        actualizarTexto("dashMaquinasOperativas", operativas);
        actualizarTexto("dashMaquinasDetenidas", detenidas);
        actualizarTexto("dashPorcentajeOperativas", porcentaje + "%");
        actualizarTexto("dashOperativasTexto", operativas);
        actualizarTexto("dashDetenidasTexto", detenidas);
        actualizarTexto("dashTotalMaquinas", total);

        const donut = document.querySelector(".donut-chart");
        if (donut) {
            donut.style.background = `conic-gradient(#41c977 0% ${porcentaje}%, #ff4d5a ${porcentaje}% 100%)`;
        }

    } catch (error) {
        console.error("Error cargando estado de máquinas:", error);
    }
}

/* =========================
   UTILIDADES
========================= */
function actualizarTexto(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
}

function actualizarAltura(id, porcentaje) {
    const elemento = document.getElementById(id);

    if (elemento) {
        const altura = Math.max(12, Math.min(porcentaje, 100));
        elemento.style.height = `${altura}%`;
    }
}

/* =========================
   DROPDOWN TURNO DASHBOARD
========================= */
function toggleDropdownTurno(){
    const menu = document.getElementById("menuFiltroTurno");
    if(menu){
        menu.classList.toggle("active");
    }
}

function seleccionarFiltroTurno(valor){
    const texto = document.getElementById("textoFiltroTurno");
    const menu = document.getElementById("menuFiltroTurno");

    if(texto){
        texto.textContent = valor;
    }

    if(menu){
        menu.classList.remove("active");
    }
}

document.addEventListener("click", function(e){
    const dropdown = document.getElementById("dropdownTurno");

    if(dropdown && !dropdown.contains(e.target)){
        const menu = document.getElementById("menuFiltroTurno");
        if(menu){
            menu.classList.remove("active");
        }
    }
});