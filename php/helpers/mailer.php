<?php

/* ===============================
   IRONIX - HELPER MAILER
   Ruta: php/helpers/mailer.php
================================ */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . "/../../vendor/autoload.php";


if (!function_exists("enviarCorreoIronix")) {
    function enviarCorreoIronix($destinatario, $nombreDestinatario, $asunto, $html, $textoPlano = "")
    {
        $configPath = __DIR__ . "/../config/mail_config.php";

        if (!file_exists($configPath)) {
            return [
                "success" => false,
                "message" => "No se encontró la configuración de correo",
                "error" => "Archivo mail_config.php no existe"
            ];
        }

        $config = require $configPath;

        $camposRequeridos = [
            "host",
            "username",
            "password",
            "port",
            "from_email",
            "from_name"
        ];

        foreach ($camposRequeridos as $campo) {
            if (!isset($config[$campo]) || trim((string) $config[$campo]) === "") {
                return [
                    "success" => false,
                    "message" => "Configuración de correo incompleta",
                    "error" => "Falta el campo: " . $campo
                ];
            }
        }

        $destinatario = trim((string) $destinatario);
        $nombreDestinatario = trim((string) $nombreDestinatario);
        $asunto = trim((string) $asunto);
        $html = (string) $html;
        $textoPlano = (string) $textoPlano;

        if ($destinatario === "" || !filter_var($destinatario, FILTER_VALIDATE_EMAIL)) {
            return [
                "success" => false,
                "message" => "Destinatario inválido",
                "error" => "El correo destinatario no es válido"
            ];
        }

        if ($asunto === "") {
            return [
                "success" => false,
                "message" => "Asunto inválido",
                "error" => "El asunto del correo no puede estar vacío"
            ];
        }

        if (trim(strip_tags($html)) === "") {
            return [
                "success" => false,
                "message" => "Contenido inválido",
                "error" => "El contenido del correo no puede estar vacío"
            ];
        }

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();

            $mail->Host = $config["host"];
            $mail->SMTPAuth = true;
            $mail->Username = $config["username"];
            $mail->Password = $config["password"];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = intval($config["port"]);

            $mail->CharSet = "UTF-8";
            $mail->Encoding = "base64";

            $mail->setFrom($config["from_email"], $config["from_name"]);
            $mail->addAddress($destinatario, $nombreDestinatario !== "" ? $nombreDestinatario : $destinatario);

            $mail->isHTML(true);
            $mail->Subject = $asunto;
            $mail->Body = $html;
            $mail->AltBody = $textoPlano !== "" ? $textoPlano : trim(strip_tags($html));

            $mail->send();

            return [
                "success" => true,
                "message" => "Correo enviado correctamente"
            ];

        } catch (Exception $e) {
            return [
                "success" => false,
                "message" => "Error al enviar correo",
                "error" => $mail->ErrorInfo !== "" ? $mail->ErrorInfo : $e->getMessage()
            ];
        }
    }
}