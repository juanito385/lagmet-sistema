/* =========================
   IR A HOY
========================= */
window.irHoy = function(){
    mostrarGanttPorMaquina();
};

/* =========================
   GANTT NORMAL FRAPPE
========================= */
window.mostrarGantt = async function(){

    esperarGantt(async () => {

        const cont = document.getElementById("gantt");
        const sidebar = document.getElementById("gantt-sidebar");

        if (!cont) return;

        cont.innerHTML = "Cargando Gantt...";

        if (sidebar) {
            sidebar.innerHTML = "";
        }

        try {
            const response = await fetch("php/produccion/obtener_produccion.php");
            const data = await response.json();

            if (!data.success || !data.data || !data.data.length) {
                cont.innerHTML = "No hay datos para generar la carta Gantt";
                return;
            }

            data.data.sort((a, b) => {
                const fechaA = fechaLocal(a.fecha) || new Date(9999, 11, 31);
                const fechaB = fechaLocal(b.fecha) || new Date(9999, 11, 31);

                return fechaA - fechaB;
            });

            const tareasSidebar = [];

            const tareas = data.data.map((item, index) => {
                let inicio = fechaParaGantt(item.fecha);
                let fin = fechaParaGantt(item.fecha_fin);

                if (!inicio) {
                    inicio = fechaParaGantt(new Date());
                }

                if (!fin) {
                    let dias = parseInt(item.dias);

                    if (isNaN(dias) || dias <= 0) {
                        dias = 1;
                    }

                    fin = sumarDias(inicio, dias);
                }

                if (!fin) {
                    fin = sumarDias(inicio, 1);
                }

                if (fechaLocal(inicio) > fechaLocal(fin)) {
                    fin = sumarDias(inicio, 1);
                }

                const progress = calcularProgreso(inicio, fin);
                const claseEstado = obtenerClaseEstado(progress, item, fin);

                const producto = item.producto || "Sin nombre";
                const pedido = item.numero_pedido || "-";
                const maquina =
                    item.maquina ||
                    item.maquinas ||
                    item.nombre_maquina ||
                    "Sin máquina";

                const operador =
                    item.operador ||
                    item.usuario ||
                    item.usuario_nombre ||
                    "Admin";

                tareasSidebar.push({
                    producto,
                    pedido,
                    maquina,
                    operador,
                    claseEstado
                });

                return {
                    id: String(item.id || index + 1),
                    name: `${producto} (${pedido})`,
                    start: inicio,
                    end: fin,
                    progress,
                    dependencies: "",
                    custom_class: claseEstado
                };
            });

            const tareasValidas = tareas.filter(tarea => {
                return tarea.start &&
                       tarea.end &&
                       !isNaN(fechaLocal(tarea.start)?.getTime()) &&
                       !isNaN(fechaLocal(tarea.end)?.getTime());
            });

            const sidebarValidas = tareasSidebar.filter((_, index) => {
                return tareasValidas[index];
            });

            if (!tareasValidas.length) {
                cont.innerHTML = "No hay tareas válidas para mostrar en la Carta Gantt";
                return;
            }

            cont.innerHTML = "";

            renderGanttSidebar(sidebarValidas);

            new window.Gantt("#gantt", tareasValidas, {
                header_height: 74,
                column_width: 38,
                step: 24,
                view_mode: "Day",
                language: "es",
                bar_height: 30,
                padding: 22
            });

        } catch (error) {
            console.error("❌ Error al generar la Carta Gantt:", error);
            cont.innerHTML = "Error al generar la carta Gantt";
        }
    });
};