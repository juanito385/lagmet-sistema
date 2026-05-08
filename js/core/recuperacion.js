let emailRecuperacion = "";

/* MOSTRAR RECUPERAR */
function mostrarRecuperar(){
    document.getElementById("login").style.display = "none";
    document.getElementById("recuperar").style.display = "flex";
}

/* VOLVER */
function volverLogin(){
    document.getElementById("recuperar").style.display = "none";
    document.getElementById("login").style.display = "flex";

    // reset visual
    document.getElementById("paso1").style.display="block";
    document.getElementById("paso2").style.display="none";
    document.getElementById("paso3").style.display="none";

    document.getElementById("emailRec").value="";
    document.getElementById("codigo").value="";
    document.getElementById("nuevaPass").value="";
}

/* ACTIVAR BOTÓN */
document.addEventListener("input", e=>{
    if(e.target.id === "emailRec"){
        const val = e.target.value;
        const btn = document.getElementById("btnEnviar");

        if(val.includes("@")){
            btn.disabled = false;
            btn.classList.add("active");
        }else{
            btn.disabled = true;
            btn.classList.remove("active");
        }
    }
});

/* PASO 1 */
async function enviarCodigo(){
    const email = document.getElementById("emailRec").value;

    const res = await fetch("php/auth/enviar_codigo.php",{
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:`email=${email}`
    });

    const data = await res.json();

    if(data.success){
        emailRecuperacion = email;
        document.getElementById("paso1").style.display="none";
        document.getElementById("paso2").style.display="block";
    }else{
        alert("Correo no encontrado");
    }
}

/* PASO 2 */
async function verificarCodigo(){
    const codigo = document.getElementById("codigo").value;

    const res = await fetch("php/auth/verificar_codigo.php",{
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:`email=${emailRecuperacion}&codigo=${codigo}`
    });

    const data = await res.json();

    if(data.success){
        document.getElementById("paso2").style.display="none";
        document.getElementById("paso3").style.display="block";
    }else{
        alert("Código incorrecto");
    }
}

/* PASO 3 */
async function cambiarPasswordRecuperacion(){
    const pass = document.getElementById("nuevaPass").value;

    const res = await fetch("php/auth/recuperar_password_confirmar.php",{
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:`email=${emailRecuperacion}&password=${pass}`
    });

    const data = await res.json();

    if(data.success){
        alert("Contraseña actualizada");
        volverLogin();
    } else {
        alert(data.message || "Error al actualizar");
    }
}