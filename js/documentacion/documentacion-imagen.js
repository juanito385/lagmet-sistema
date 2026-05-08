/* =========================
   DESCARGAR IMAGEN GANTT
========================= */
async function descargarGanttImagen() {
    const gantt = document.getElementById("gantt");

    if (!gantt || gantt.innerHTML.trim() === "") {
        alert("Primero debes generar la Carta Gantt");
        return;
    }

    try {
        const canvas = await html2canvas(gantt, {
            scale: 2,
            backgroundColor: "#ffffff"
        });

        const imagen = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = imagen;
        link.download = "Carta_Gantt_LAGMET.png";
        link.click();

    } catch (error) {
        console.error("Error al descargar imagen:", error);
        alert("No se pudo descargar la imagen");
    }
}

window.descargarGanttImagen = descargarGanttImagen;