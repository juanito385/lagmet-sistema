/* =========================
   GUARDAR / ACTUALIZAR
========================= */
async function guardarDatos() {
    const pedidoBase = document.getElementById("pedido").value.trim();
    const ot = document.getElementById("ot")?.value.trim() || "";
    const pedido = ot ? `${pedidoBase}-${ot}` : pedidoBase;

    const codigo = document.getElementById("Codigo").value.trim();
    const producto = document.getElementById("Producto").value.trim();
    const cantidad = parseInt(document.getElementById("cantidadProductos").value) || 0;
    const fecha = document.getElementById("fecha").value;
    const fecha_fin = document.getElementById("fechaFin").value;
    const trabaja_sabado = document.getElementById("trabajaSabado").value;

    const situacion_horas = parseInt(document.getElementById("situacionHoras")?.value) || 0;
    const situacion_minutos = parseInt(document.getElementById("situacionMinutos")?.value) || 0;
    const situacion_descripcion = document.getElementById("situacionDescripcion")?.value.trim() || "";
    const tiempo_muerto = (situacion_horas * 60) + situacion_minutos;

    const fallo_maquina = document.getElementById("falloMaquina")?.value || "no";
    const maquina_fallo = document.getElementById("maquinaFallo")?.value || "";

    const dias = parseInt(document.getElementById("dias").value) || 0;
    const grupo = document.getElementById("grupo").value;
    const almuerzo = "no";
    const salida = document.getElementById("salida").textContent;

    const user = JSON.parse(localStorage.getItem("user"));

    if (!pedido || !codigo || !producto || cantidad <= 0) {
        alert("Completa los datos obligatorios");
        return;
    }

    if (!fecha) {
        alert("Debes ingresar la Fecha Inicio");
        return;
    }

    if (!salida || salida === "--") {
        alert("Primero debes calcular el tiempo de producción");
        return;
    }

    if (dias <= 0) {
        alert("Debe existir al menos 1 día de producción");
        return;
    }

    if (fallo_maquina === "si" && maquina_fallo === "") {
        alert("Debes seleccionar la máquina con fallo");
        return;
    }

    const filasValidacion = document.querySelectorAll("#tablaMaquinas tbody tr");

    let algunaActiva = false;
    let totalHoras = 0;

    filasValidacion.forEach(f => {
        const uso = f.querySelector(".uso").value;
        const horas = parseInt(f.querySelector(".horas").value) || 0;
        const minutos = parseInt(f.querySelector(".minutos").value) || 0;

        if (uso === "si") {
            algunaActiva = true;
            totalHoras += horas + (minutos / 60);
        }
    });

    if (!algunaActiva) {
        alert("Debes seleccionar al menos una máquina en 'Sí'");
        cambiarTabMonitoreo("maquinas");
        return;
    }

    if (totalHoras < 1) {
        alert("Debes ingresar al menos 1 hora total de trabajo");
        cambiarTabMonitoreo("maquinas");
        return;
    }

    const maquinas = [];

    filasValidacion.forEach(f => {
        maquinas.push({
            id_maquina: f.getAttribute("data-id-maquina"),
            zona: f.getAttribute("data-zona"),
            maquina: f.getAttribute("data-maquina"),
            uso: f.querySelector(".uso").value,
            horas: parseInt(f.querySelector(".horas").value) || 0,
            minutos: parseInt(f.querySelector(".minutos").value) || 0
        });
    });

    const editandoId = localStorage.getItem("editandoId");

    const url = editandoId
        ? "/proyecto_lagmet/php/actualizar_produccion.php"
        : "/proyecto_lagmet/php/guardar_produccion.php";

    const body = {
        numero_pedido: pedido,
        codigo,
        producto,
        cantidad,
        fecha,
        fecha_fin,
        tiempo_muerto,
        situacion_horas,
        situacion_minutos,
        situacion_descripcion,
        fallo_maquina,
        maquina_fallo,
        dias,
        grupo,
        almuerzo,
        trabaja_sabado,
        salida,
        usuario_id: user?.id || null,
        maquinas
    };

    if (editandoId) body.id = editandoId;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success) {
            localStorage.removeItem("editandoId");
            alert("Guardado correctamente");

            limpiarFormulario();

            if (typeof renderProductos === "function") {
                renderProductos();
            }

            if (typeof cargarDashboard === "function") {
                cargarDashboard();
            }

        } else {
            alert(data.message);
        }

    } catch (e) {
        console.error(e);
        alert("Error servidor");
    }
}

/* =========================
   LIMPIAR
========================= */
function limpiarFormulario() {
    document.getElementById("pedido").value = "";

    const otInput = document.getElementById("ot");
    if (otInput) otInput.value = "";

    document.getElementById("Codigo").value = "";
    document.getElementById("Producto").value = "";
    document.getElementById("cantidadProductos").value = 1;
    document.getElementById("fecha").value = "";

    document.getElementById("dias").value = "";
    document.getElementById("fechaFin").value = "";

    const fechaFinVisual = document.getElementById("fechaFinVisual");
    if (fechaFinVisual) fechaFinVisual.value = "";

    document.getElementById("salida").textContent = "--";
    document.getElementById("grupo").value = "1";
    actualizarGrupoActual();
    document.getElementById("trabajaSabado").value = "no";

    const situacionHoras = document.getElementById("situacionHoras");
    const situacionMinutos = document.getElementById("situacionMinutos");
    const situacionDescripcion = document.getElementById("situacionDescripcion");

    if (situacionHoras) situacionHoras.value = "0";
    if (situacionMinutos) situacionMinutos.value = "0";
    if (situacionDescripcion) situacionDescripcion.value = "";

    const modalHoras = document.getElementById("modalSituacionHoras");
    const modalMinutos = document.getElementById("modalSituacionMinutos");
    const modalDescripcion = document.getElementById("modalSituacionDescripcion");

    if (modalHoras) modalHoras.value = "0";
    if (modalMinutos) modalMinutos.value = "0";
    if (modalDescripcion) modalDescripcion.value = "";

    cerrarModalSituacion();

    const falloMaquina = document.getElementById("falloMaquina");
    const maquinaFallo = document.getElementById("maquinaFallo");

    if (falloMaquina) falloMaquina.value = "no";

    if (maquinaFallo) {
        maquinaFallo.value = "";
        maquinaFallo.style.display = "none";
    }

    document.querySelectorAll("#tablaMaquinas tbody tr").forEach(f => {
        const uso = f.querySelector(".uso");
        const horas = f.querySelector(".horas");
        const minutos = f.querySelector(".minutos");

        if (uso) uso.value = "no";
        if (horas) horas.value = 0;
        if (minutos) minutos.value = 0;

        actualizarColorFila(f);
    });

    document.getElementById("buscarMaquina") &&
        (document.getElementById("buscarMaquina").value = "");

    document.getElementById("filtroUsoMaquinas") &&
        (document.getElementById("filtroUsoMaquinas").value = "todas");

    filtroZonaActual = "todas";

    document.querySelectorAll(".zona-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.zona === "todas");
    });

    calcular();
    actualizarGrupoActual();
    aplicarFiltrosMaquinas();
    cambiarTabMonitoreo("info");
}

/* =========================
   CANCELAR PRODUCCIÓN
========================= */
function cancelarProduccion() {
    localStorage.removeItem("editandoId");
    limpiarFormulario();
}