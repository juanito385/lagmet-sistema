<?php

/* =========================
   IRONIX - VERSION GANTT
   Helper interno
========================= */

/*
    Este archivo NO lleva guard directamente.

    Motivo:
    - No es un endpoint público.
    - No recibe peticiones directas desde JavaScript.
    - Solo expone la función actualizarVersionGantt($conn).

    La protección debe estar en los endpoints que llaman a esta función:
    - guardar_produccion.php
    - actualizar_produccion.php
    - eliminar_produccion.php
    - cambiar_estado.php
*/


if (!function_exists("actualizarVersionGantt")) {

    function actualizarVersionGantt($conn)
    {
        if (!$conn instanceof mysqli) {
            throw new Exception("Conexión inválida al actualizar versión del Gantt");
        }

        $sql = "
            INSERT INTO sistema_versiones 
                (modulo, version, actualizado_en)
            VALUES 
                ('gantt_maquinas', 1, NOW())
            ON DUPLICATE KEY UPDATE
                version = version + 1,
                actualizado_en = NOW()
        ";

        if (!$conn->query($sql)) {
            throw new Exception("Error al actualizar versión del Gantt: " . $conn->error);
        }

        return true;
    }
}