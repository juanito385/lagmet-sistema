/* =========================
   ELIMINAR PRODUCTO
========================= */
async function eliminarProducto(id) {

    /*
        Guardia visual/frontend:
        aunque el botón esté oculto, alguien podría intentar ejecutar
        eliminarProducto(id) desde consola. Por eso también validamos aquí.
    */
    if (
        typeof usuarioPuedeAccionIronix === "function" &&
        !usuarioPuedeAccionIronix("productos", "eliminar")
    ) {
        alert("No tienes permisos para eliminar productos");
        return;
    }

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