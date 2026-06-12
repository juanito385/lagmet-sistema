<?php

/* ==================================================
   PERFIL - OBTENER USUARIO
   Ruta: php/perfil/obtener_usuario.php
================================================== */

require_once __DIR__ . "/../core/request.php";
require_once __DIR__ . "/../conexion.php";

/* =========================
   VALIDAR MÉTODO
========================= */

validarMetodo("GET");

/* =========================
   OBTENER ID USUARIO
========================= */

$id = intval(obtenerGet("usuario_id", 0));

if ($id <= 0) {
    responderError("ID de usuario no recibido", 422);
}

/* =========================
   CONSULTAR USUARIO
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
    WHERE id = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    responderError("Error al preparar consulta", 500);
}

$stmt->bind_param("i", $id);

if (!$stmt->execute()) {
    $stmt->close();
    responderError("Error al ejecutar consulta", 500);
}

$result = $stmt->get_result();

if ($result && $result->num_rows > 0) {
    $usuario = $result->fetch_assoc();

    $stmt->close();
    $conn->close();

    responderJSON([
        "success" => true,
        "usuario" => $usuario
    ]);
}

$stmt->close();
$conn->close();

responderError("Usuario no encontrado", 404);