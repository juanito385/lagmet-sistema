<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . "/../../vendor/autoload.php";

function enviarCorreoIronix($destinatario, $nombreDestinatario, $asunto, $html, $textoPlano = "")
{
    $config = require __DIR__ . "/../config/mail_config.php";

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();

        $mail->Host = $config["host"];
        $mail->SMTPAuth = true;
        $mail->Username = $config["username"];
        $mail->Password = $config["password"];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $config["port"];

        $mail->CharSet = "UTF-8";

        $mail->setFrom($config["from_email"], $config["from_name"]);
        $mail->addAddress($destinatario, $nombreDestinatario);

        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body = $html;
        $mail->AltBody = $textoPlano !== "" ? $textoPlano : strip_tags($html);

        $mail->send();

        return [
            "success" => true,
            "message" => "Correo enviado correctamente"
        ];

    } catch (Exception $e) {
        return [
            "success" => false,
            "message" => "Error al enviar correo",
            "error" => $mail->ErrorInfo
        ];
    }
}