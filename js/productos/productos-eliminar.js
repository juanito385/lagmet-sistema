/* =========================
   ELIMINAR PRODUCTO
========================= */
async function eliminarProducto(id) {
    const confirmar = confirm("¿Deseas eliminar este registro?");

    if (!confirmar) return;

    try {
        const response = await fetch("php/produccion/eliminar_produccion.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });

        const data = await response.json();

        if (data.success) {
            alert("Registro eliminado correctamente");
            renderProductos();
        } else {
            alert(data.message || "No se pudo eliminar");
        }

    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor");
    }
}

window.eliminarProducto = eliminarProducto;