@echo off
cd /d C:\xampp\htdocs\proyecto_lagmet
browser-sync start --proxy "http://localhost" --startPath "/proyecto_lagmet/inicio.html" --files "inicio.html, recuperar.html, nueva_password.html, views/**/*.html, css/**/*.css, js/**/*.js, php/**/*.php"
pause