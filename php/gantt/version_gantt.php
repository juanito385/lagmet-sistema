<?php

function actualizarVersionGantt($conn) {

    $sql = "
        INSERT INTO sistema_versiones (modulo, version, actualizado_en)
        VALUES ('gantt_maquinas', 1, NOW())
        ON DUPLICATE KEY UPDATE
            version = version + 1,
            actualizado_en = NOW()
    ";

    if (!$conn->query($sql)) {
        throw new Exception("Error al actualizar versión del Gantt: " . $conn->error);
    }

    return true;
}

?>