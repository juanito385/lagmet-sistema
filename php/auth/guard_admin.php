<?php

/* =========================
   IRONIX - GUARD ADMIN
========================= */

/*
    Este archivo protege endpoints PHP exclusivos para administradores.
    Primero valida sesión activa mediante guard.php.
    Luego exige rol admin.
*/

require_once __DIR__ . "/guard.php";


/* =========================
   VALIDAR ROL ADMIN
========================= */

ironixRequerirRol("admin");