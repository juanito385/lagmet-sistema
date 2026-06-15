import os
import pymysql

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

app = FastAPI(
    title="IRONIX Python API",
    description="API Python complementaria para IRONIX/LAGMET",
    version="1.0.0"
)


def obtener_conexion_mysql():
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "lagmet_db"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )


@app.get("/")
def inicio():
    return {
        "success": True,
        "message": "IRONIX Python API activa"
    }


@app.get("/api/v1/health")
def health():
    return {
        "success": True,
        "message": "API Python funcionando correctamente"
    }


@app.get("/api/v1/db-test")
def probar_base_datos():
    try:
        conexion = obtener_conexion_mysql()

        with conexion.cursor() as cursor:
            cursor.execute("SELECT DATABASE() AS base_datos")
            resultado = cursor.fetchone()

        conexion.close()

        return {
            "success": True,
            "message": "Conexión a MySQL correcta",
            "base_datos": resultado["base_datos"]
        }

    except Exception as error:
        return {
            "success": False,
            "message": "Error al conectar con MySQL",
            "error": str(error)
        }