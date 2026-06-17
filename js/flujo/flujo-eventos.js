/* =========================
   EVENTOS
========================= */
function configurarEventosFlujoProceso() {
    const btnCargar = document.getElementById("btnCargarFlujo");
    const btnLimpiar = document.getElementById("btnLimpiarFlujo");
    const btnDeshacer = document.getElementById("btnDeshacerFlujo");

    const inputBuscarProducto = document.getElementById("inputBuscarProductoFlujo");
    const btnLimpiarProducto = document.getElementById("btnLimpiarProductoFlujo");
    const listaProductos = document.getElementById("listaProductosFlujo");

    const btnOpciones = document.getElementById("btnOpcionesFlujo");
    const btnCerrarOpciones = document.getElementById("btnCerrarOpcionesFlujo");
    const btnExportarImagen = document.getElementById("btnExportarImagenFlujo");
    const btnExportarPdf = document.getElementById("btnExportarPdfFlujo");
    const btnRestablecer = document.getElementById("btnRestablecerFlujo");

    /*
    Permisos visuales para exportación de Flujo Proceso.
    Se agregan por JS porque los botones ya existen en la vista
    y este archivo centraliza sus eventos.
    */
    if (btnExportarImagen) {
        btnExportarImagen.setAttribute("data-permiso-modulo", "flujo-proceso");
        btnExportarImagen.setAttribute("data-permiso-accion", "exportar");
    }

    if (btnExportarPdf) {
        btnExportarPdf.setAttribute("data-permiso-modulo", "flujo-proceso");
        btnExportarPdf.setAttribute("data-permiso-accion", "exportar");
    }

    const board = document.getElementById("flujoBoard");

    if (inputBuscarProducto) {
        inputBuscarProducto.oninput = () => {
            const valor = inputBuscarProducto.value.trim();

            const inputSeleccionado = document.getElementById("inputProductoSeleccionadoFlujo");
            if (inputSeleccionado) inputSeleccionado.value = "";

            renderizarListaProductosFlujo(valor);
            mostrarListaProductosFlujo();
        };

        inputBuscarProducto.onfocus = () => {
            renderizarListaProductosFlujo(inputBuscarProducto.value.trim());
            mostrarListaProductosFlujo();
        };
    }

    if (btnLimpiarProducto) {
        btnLimpiarProducto.onclick = () => {
            limpiarProductoSeleccionadoFlujo();
        };
    }

    if (listaProductos) {
        listaProductos.onclick = e => {
            const item = e.target.closest(".flujo-producto-item");

            if (!item || !item.dataset.id) return;

            seleccionarProductoDesdeListaFlujo(item.dataset.id);
        };
    }

    if (btnCargar) {
        btnCargar.onclick = cargarFlujoSeleccionado;
    }

    if (btnLimpiar) {
        btnLimpiar.onclick = limpiarFlujoProceso;
    }

    if (btnDeshacer) {
        btnDeshacer.onclick = deshacerUltimoCambioFlujo;
    }

    if (btnOpciones) {
        btnOpciones.onclick = e => {
            e.stopPropagation();
            alternarPanelOpcionesFlujo();
        };
    }

    if (btnCerrarOpciones) {
        btnCerrarOpciones.onclick = cerrarPanelOpcionesFlujo;
    }

    if (btnExportarImagen) {
        btnExportarImagen.onclick = () => {
            if (
                typeof usuarioPuedeAccionIronix === "function" &&
                !usuarioPuedeAccionIronix("flujo-proceso", "exportar")
            ) {
                alert("No tienes permisos para exportar Flujo Proceso");
                return;
            }

            exportarImagenFlujo();
        };
    }

    if (btnExportarPdf) {
        btnExportarPdf.onclick = () => {
            if (
                typeof usuarioPuedeAccionIronix === "function" &&
                !usuarioPuedeAccionIronix("flujo-proceso", "exportar")
            ) {
                alert("No tienes permisos para exportar Flujo Proceso");
                return;
            }

            exportarPdfFlujo();
        };
    }

    if (btnRestablecer) {
        btnRestablecer.onclick = restablecerFlujoProceso;
    }

    if (board) {
        board.onclick = e => {
            const btnPlus = e.target.closest(".flujo-grid-plus");

            if (btnPlus) {
                e.stopPropagation();

                const direccion = btnPlus.dataset.direccion || "right";
                const origen = btnPlus.dataset.origen || "operacion";
                const indexBase = parseInt(btnPlus.dataset.indexBase || "-1", 10);

                if (Number.isNaN(indexBase) || indexBase < 0) return;

                if (origen === "placeholder") {
                    avanzarDesdeCardVacia(indexBase, direccion);
                    return;
                }

                if (direccion === "down") {
                    crearCardVaciaAbajo(indexBase);
                    return;
                }

                avanzarFlujoProceso(direccion);
                return;
            }

            const cardTemporal = e.target.closest('[data-tipo-card="vacia"], [data-tipo-card="temporal"]');

            if (cardTemporal) {
                const indexBase = parseInt(cardTemporal.dataset.indexBase || "-1", 10);
                const posicionVacia = parseInt(cardTemporal.dataset.posicionVacia || "-1", 10);

                if (!Number.isNaN(indexBase) && !Number.isNaN(posicionVacia)) {
                    abrirModalEditarOperacionTemporalFlujo(indexBase, posicionVacia);
                }

                return;
            }

            const cardReal = e.target.closest('[data-tipo-card="real"]');

            if (cardReal) {
                const indexOperacion = parseInt(cardReal.dataset.operacionIndex || "-1", 10);

                if (!Number.isNaN(indexOperacion) && indexOperacion >= 0) {
                    abrirModalEditarOperacionRealFlujo(indexOperacion);
                }
            }
        };
    }

    configurarEventosModalFlujo();

    if (!window.__flujoClickGlobalRegistrado) {
        window.__flujoClickGlobalRegistrado = true;

        document.addEventListener("click", e => {
            const contenedorProducto = e.target.closest(".flujo-field-producto");
            const contenedorOpciones = e.target.closest(".flujo-opciones-wrapper");

            if (!contenedorProducto) {
                ocultarListaProductosFlujo();
            }

            if (!contenedorOpciones) {
                cerrarPanelOpcionesFlujo();
            }
        });
    }

    if (!window.__flujoResizeRegistrado) {
        window.__flujoResizeRegistrado = true;

        let resizeTimer = null;

        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(() => {
                dibujarConectoresDinamicosFlujo();
            }, 120);
        });
    }

    /*
    Aplicar permisos visuales después de configurar los botones.
    */
    if (typeof aplicarPermisosAccionesIronix === "function") {
        aplicarPermisosAccionesIronix();
    }
}
