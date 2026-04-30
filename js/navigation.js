function showSection(id){
    document.querySelectorAll('.section')
        .forEach(s => s.classList.remove('active'));

    document.getElementById(id).classList.add('active');

    document.querySelectorAll('.menu button')
        .forEach(b => b.classList.remove('active'));

    const boton = document.querySelector(`.menu button[onclick="showSection('${id}')"]`);
    if(boton) boton.classList.add('active');

    if(id === "productos") renderProductos();
    if(id === "documentacion") mostrarGantt();
}