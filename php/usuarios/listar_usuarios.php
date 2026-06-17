<?php

/* =========================
   IRONIX - LISTAR USUARIOS
========================= */

require_once __DIR__ . "/../auth/guard.php";

/* =========================
   GUARD BACKEND - FASE 4
========================= */

ironixRequerirMetodo("GET");
ironixRequerirPermiso("configuracion", "ver");


require_once __DIR__ . "/../conexion.php";

$conn->set_charset("utf8mb4");


try {

    /* =========================
       LISTAR USUARIOS
    ========================= */

    $sql = "
        SELECT
            id,
            nombre,
            correo,
            rol,
            telefono,
            area,
            idioma,
            estado,
            fecha_creacion
        FROM usuarios
        ORDER BY 
            CASE 
                WHEN rol = 'admin' THEN 0
                ELSE 1
            END,
            id ASC
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Error al preparar consulta de usuarios: " . $conn->error);
    }

    if (!$stmt->execute()) {
        throw new Exception("Error al ejecutar consulta de usuarios: " . $stmt->error);
    }

    $result = $stmt->get_result();

    $usuarios = [];

    while ($row = $result->fetch_assoc()) {
        $usuarios[] = [
            "id" => intval($row["id"]),
            "nombre" => $row["nombre"],
            "correo" => $row["correo"],
            "rol" => $row["rol"],
            "telefono" => $row["telefono"],
            "area" => $row["area"],
            "idioma" => $row["idioma"],
            "estado" => $row["estado"],
            "fecha_creacion" => $row["fecha_creacion"]
        ];
    }

    $stmt->close();
    $conn->close();


    /* =========================
       RESPUESTA
    ========================= */

    ironixResponderJson([
        "success" => true,
        "usuarios" => $usuarios,
        "total" => count($usuarios)
    ], 200);

} catch (Throwable $e) {

    if (isset($stmt) && $stmt instanceof mysqli_stmt) {
        $stmt->close();
    }

    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }

    ironixResponderJson([
        "success" => false,
        "message" => "Error al listar usuarios",
        "error" => $e->getMessage(),
        "usuarios" => [],
        "total" => 0
    ], 500);
}