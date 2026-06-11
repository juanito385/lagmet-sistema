console.log("ARCHIVO flujo-proceso.js CARGADO CORRECTAMENTE");

/* =========================
   FLUJO PROCESO
   Render dinámico con avance progresivo
========================= */

let flujoProductosBD = [];
let flujoProductoSeleccionado = null;
let flujoCantidadOperacionesVisibles = 1;

/*
    Cards temporales creadas manualmente.
    Clave: índice de la operación base.
    Valor: array de cards temporales.
*/
let flujoCardsVaciasAbajo = {};

let flujoEdicionActual = null;

/*
    Copia original de los datos cargados desde BD.
    Sirve para restablecer el flujo si el usuario editó algo.
*/
let flujoProductosOriginalesBD = [];

/*
    Historial temporal para deshacer cambios visuales.
*/
let flujoHistorialEstados = [];
