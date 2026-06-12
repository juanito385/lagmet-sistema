<?php

/* =========================
   IRONIX - GUARD ADMIN
========================= */

/*
    Este archivo protege endpoints PHP exclusivos para administradores.
    Primero valida que exista sesión activa.
    Luego valida que el rol sea admin.
*/

require_once __DIR__ . "/guard.php";


/* =========================
   VALIDAR ROL ADMIN
========================= */

if ($IRONIX_USER_ROLE !== "admin") {
    ironixResponderSinPermisos("Acceso restringido solo para administradores");
}

?>