<?php

/* =========================
   IRONIX - GUARD ADMIN
========================= */

/*
    Este archivo protege endpoints PHP exclusivos para administradores.

    Flujo:
    1. Carga guard.php.
    2. guard.php valida sesión activa.
    3. Luego este archivo exige rol admin.

    Nota:
    Este archivo no reemplaza permisos específicos.
    Para endpoints delicados se recomienda usar además:
    ironixRequerirPermiso("configuracion", "seguridad");
    ironixRequerirPermiso("configuracion", "permisos");
    etc.
*/

require_once __DIR__ . "/guard.php";


/* =========================
   VALIDAR ROL ADMIN
========================= */

ironixRequerirRol("admin");