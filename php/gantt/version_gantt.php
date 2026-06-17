<?php

/* =========================
   IRONIX - VERSION GANTT
   Helper interno
========================= */

/*
    Este archivo NO lleva guard directamente.
    La protección debe estar en los endpoints que llaman
    a actualizarVersionGantt($conn).
*/

if (!function_exists("actualizarVersionGantt")) {

    function actualizarVersionGantt($conn) {

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