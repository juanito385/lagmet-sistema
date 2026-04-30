console.log("Gantt existe:", typeof Gantt);

function esperarGantt(callback){
    if (window.Gantt) {
        callback();
    } else {
        setTimeout(() => esperarGantt(callback), 200);
    }
}

/* JORNADA */
const inicioJornadaHora = 7;
const inicioJornadaMin = 30;
const finJornadaHora = 16;
const finJornadaMin = 45;

/* USUARIOS */
const usuarios=[    
{email:"admin@gmail.com",password:"1234",nombre:"Admin"},
{email:"user@gmail.com",password:"1234",nombre:"Usuario"}
];

/* LOGIN */
function login(){
let email=document.getElementById("email").value;
let pass=document.getElementById("password").value;

let user=usuarios.find(u=>u.email===email && u.password===pass);

if(user){
localStorage.setItem("user",JSON.stringify(user));
iniciarApp();
}else{
document.getElementById("error").textContent="Datos incorrectos";
}
}

/* INICIAR */
function iniciarApp(){
let user=JSON.parse(localStorage.getItem("user"));

if(user){
document.getElementById("login").style.display="none";
document.getElementById("app").style.display="block";
document.getElementById("user").textContent="Hola "+user.nombre;
}
}

/* LOGOUT */
function logout(){
localStorage.removeItem("user");
location.reload();
}

function showSection(id){

    document.querySelectorAll('.section')
        .forEach(s => s.classList.remove('active'));

    document.getElementById(id).classList.add('active');

    document.querySelectorAll('.menu button')
        .forEach(b => b.classList.remove('active'));

    const boton = document.querySelector(`.menu button[onclick="showSection('${id}')"]`);
    if(boton) boton.classList.add('active');

    if(id === "productos"){
        renderProductos();
    }

    if(id === "documentacion"){
        mostrarGantt();
    }
}

/* MAQUINAS */
const oriente=[
"Torno Vertical CNC","Mandrinadora","Torno Vertical",
"Mandrinadora","Torno 1000","Torno 800",
"Torno Bulgaro","Torno Varileta","Cepillo",
"Escoplo","Taladro Radial"
];

const poniente=[
"Torno CNC 2","Torno CNC 3","Torno CNC 1",
"Centro Mecanizado 1","Centro Mecanizado 2",
"Router","Mecánica Banco","Balanceadora"
];

function horas(){
let op=`<option value="0">0h</option><option value="0.5">0.5h</option>`;
for(let i=1;i<=10;i++){ op+=`<option value="${i}">${i}h</option>`;}
return op;
}

function minutos(){
let op="";
for(let i=0;i<60;i++){ op+=`<option value="${i}">${i}m</option>`;}
return op;
}

function crear(lista,id){
let tabla=document.getElementById(id);

lista.forEach(m=>{
let fila=document.createElement("tr");

fila.innerHTML=`
<td>${m}</td>
<td>
<select class="uso">
<option value="no">No</option>
<option value="si">Sí</option>
</select>
</td>
<td>
<select class="horas">${horas()}</select>
<select class="minutos">${minutos()}</select>
</td>
`;

tabla.appendChild(fila);
});
}

crear(oriente,"tablaOriente");
crear(poniente,"tablaPoniente");

/* EVENTOS */
document.addEventListener("change",(e)=>{

if(e.target.classList.contains("uso")){
let fila=e.target.closest("tr");
fila.classList.toggle("si",e.target.value==="si");
fila.classList.toggle("no",e.target.value==="no");
}

calcular();
});

/* CALCULO */
function calcular(){

let total=0;

document.querySelectorAll("tr").forEach(f=>{
let uso=f.querySelector(".uso");
let h=f.querySelector(".horas");
let m=f.querySelector(".minutos");

if(uso && uso.value==="si"){
total += parseFloat(h.value)+(parseInt(m.value)/60);
}
});

let cantidad=parseInt(document.getElementById("cantidadProductos").value)||1;
total*=cantidad;

let almuerzo = document.getElementById("almuerzo").value;

if(almuerzo === "si"){
    total += 0.75; // 45 minutos = 0.75 horas
}

if(total===0){
document.getElementById("salida").textContent="--";
document.getElementById("dias").value="";
return;
}

let ahora=new Date();
ahora.setHours(inicioJornadaHora,inicioJornadaMin,0,0);

let restante=total;

// hora de almuerzo
let grupo = document.getElementById("grupo").value;

let almuerzoInicio, almuerzoFin;

if(grupo === "1"){
    almuerzoInicio = 12;
    almuerzoFin = 13;
}else{
    almuerzoInicio = 13;
    almuerzoFin = 14;
}

// cambios recientes 
let almuerzoAplicado = false;

while(restante > 0){

let horaActual = ahora.getHours();
let minutoActual = ahora.getMinutes();

/* 🔥 SI ESTÁ EN HORARIO DE ALMUERZO → SALTA */
if(horaActual >= almuerzoInicio && horaActual < almuerzoFin){
    ahora.setHours(almuerzoFin, 0, 0, 0);
    continue;
}

let actual = ahora.getHours() + ahora.getMinutes()/60;
let fin = finJornadaHora + finJornadaMin/60;

let disponible = fin - actual;

if(restante <= disponible){

    let tiempoFinal = new Date(ahora.getTime() + restante * 3600000);

    /* 🔥 SI EL RESULTADO CAE EN ALMUERZO */
    if(
        tiempoFinal.getHours() >= almuerzoInicio &&
        tiempoFinal.getHours() < almuerzoFin
    ){
        ahora.setHours(almuerzoFin, 0, 0, 0);
    }else{
        ahora = tiempoFinal;
    }

    restante = 0;

}else{
    restante -= disponible;
    ahora.setDate(ahora.getDate()+1);
    ahora.setHours(inicioJornadaHora,inicioJornadaMin,0,0);
}
}
 
let h=String(ahora.getHours()).padStart(2,'0');
let m=String(ahora.getMinutes()).padStart(2,'0');

let horasEnteras=Math.floor(total);
let mins=Math.round((total%1)*60);

salida.textContent=`${horasEnteras}h ${mins}m → ${h}:${m}`;

let horasDia=(finJornadaHora+finJornadaMin/60)-(inicioJornadaHora+inicioJornadaMin/60);
dias.value=Math.ceil(total/horasDia);
}

function guardarDatos(){

let data = {
    pedido: document.querySelector('input[type="text"]').value,
    cantidad: document.getElementById("cantidadProductos").value,
    salida: document.getElementById("salida").textContent,
    dias: document.getElementById("dias").value,
    grupo: document.getElementById("grupo").value
};

console.log("Datos a guardar:", data);

// 🔥 luego aquí conectamos con backend
alert("Datos guardados (temporal)");
}

/* =========================
   PRODUCTOS
========================= */

// LISTA DE PRODUCTOS
let productos = [
    { nombre: "Producto A", pedido: "001", codigo: "A01", cantidad: 10 },
    { nombre: "Producto B", pedido: "002", codigo: "B02", cantidad: 5 },
    { nombre: "Producto C", pedido: "003", codigo: "C03", cantidad: 20 }
];

// MOSTRAR PRODUCTOS
function renderProductos() {
    const tabla = document.querySelector("#tablaProductos tbody");

    if (!tabla) return;

    tabla.innerHTML = "";

    productos.forEach((producto, index) => {
        tabla.innerHTML += `
            <tr>
                <td>${producto.nombre}</td>
                <td>${producto.pedido}</td>
                <td>${producto.codigo}</td>
                <td>${producto.cantidad}</td>
                <td>
                    <button class="btn-editar" onclick="editarProducto(${index})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarProducto(${index})">Eliminar</button>
                </td>
            </tr>
        `;
    });
}

// EDITAR
function editarProducto(index) {
    let nuevoNombre = prompt("Producto:", productos[index].nombre);
    let nuevoPedido = prompt("N° Pedido:", productos[index].pedido);
    let nuevoCodigo = prompt("Código:", productos[index].codigo);
    let nuevaCantidad = prompt("Cantidad:", productos[index].cantidad);

    if (nuevoNombre && nuevoPedido && nuevoCodigo && nuevaCantidad) {
        productos[index] = {
            nombre: nuevoNombre,
            pedido: nuevoPedido,
            codigo: nuevoCodigo,
            cantidad: nuevaCantidad
        };
        renderProductos();
    }
}

// ELIMINAR
function eliminarProducto(index) {
    if (confirm("¿Eliminar producto?")) {
        productos.splice(index, 1);
        renderProductos();
    }
}



iniciarApp();

/* =========================
   GANTT DOCUMENTACION
========================= */

function mostrarGantt(){

    const cont = document.getElementById("gantt");
    cont.innerHTML = "";

    const tareas = [
        { id:'1', name:'Login', start:'2026-04-01', end:'2026-04-03', progress:100 },
        { id:'2', name:'Dashboard', start:'2026-04-04', end:'2026-04-08', progress:80 },
        { id:'3', name:'Producción', start:'2026-04-09', end:'2026-04-15', progress:60 },
        { id:'4', name:'Documentación', start:'2026-04-16', end:'2026-04-22', progress:40 }
    ];

    esperarGantt(() => {
        try {
            new window.Gantt("#gantt", tareas);
        } catch (e) {
            console.error("Error Gantt:", e);
        }
    });
} 

function generarPDF(){

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 10;

    doc.setFontSize(16);
    doc.text("INFORME - SISTEMA LAGMET", 10, y);

    y += 10;

    doc.setFontSize(12);
    doc.text("Empresa: LAGMET", 10, y);
    y += 6;
    doc.text("Área: Producción", 10, y);
    y += 6;
    doc.text("Fecha: 23/04/2026", 10, y);

    y += 10;

    doc.text("OBJETIVO:", 10, y);
    y += 6;
    doc.text("Optimizar el control de producción y tiempos.", 10, y);

    y += 10;

    doc.text("DATOS DE PRODUCCIÓN:", 10, y);
    y += 6;

    const listaPDF = [
        "Eje Industrial - Pedido 1045 - 25 unidades",
        "Rodamiento XL - Pedido 1046 - 10 unidades",
        "Soporte Base - Pedido 1047 - 40 unidades",
        "Engranaje Pro - Pedido 1048 - 15 unidades",
        "Cilindro CNC - Pedido 1049 - 8 unidades"
    ];

    listaPDF.forEach(p => {
        doc.text("- " + p, 10, y);
        y += 6;
    });

    y += 6;

    doc.text("MAQUINARIA:", 10, y);
    y += 6;

    doc.text("Zona Oriente: Torno CNC, Mandrinadora, Taladro", 10, y);
    y += 6;
    doc.text("Zona Poniente: CNC, Router, Balanceadora", 10, y);

    y += 10;

    doc.text("JORNADA:", 10, y);
    y += 6;
    doc.text("07:30 a 16:45 (Incluye almuerzo 45 min)", 10, y);

    y += 10;

    doc.text("CONCLUSIÓN:", 10, y);
    y += 6;
    doc.text("El sistema mejora la planificación y productividad.", 10, y);

    doc.save("Informe_LAGMET.pdf");
}