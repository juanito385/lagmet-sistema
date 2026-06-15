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


@app.get("/api/v1/dashboard/resumen")
def obtener_resumen_dashboard():
    try:
        conexion = obtener_conexion_mysql()

        with conexion.cursor() as cursor:

            # Resumen de producción
            cursor.execute("""
                SELECT
                    COUNT(*) AS total_producciones,

                    SUM(CASE 
                        WHEN estado_actual = 'pendiente' 
                        THEN 1 ELSE 0 
                    END) AS pendientes,

                    SUM(CASE 
                        WHEN estado_actual = 'en_proceso' 
                        THEN 1 ELSE 0 
                    END) AS en_proceso,

                    SUM(CASE 
                        WHEN estado_actual = 'pausado' 
                        THEN 1 ELSE 0 
                    END) AS pausados,

                    SUM(CASE 
                        WHEN estado_actual = 'terminado' 
                        THEN 1 ELSE 0 
                    END) AS terminados,

                    SUM(CASE 
                        WHEN estado_actual = 'entregado' 
                        THEN 1 ELSE 0 
                    END) AS entregados,

                    SUM(CASE 
                        WHEN estado_actual = 'atrasado' 
                        THEN 1 ELSE 0 
                    END) AS atrasados_estado,

                    SUM(CASE 
                        WHEN estado_actual NOT IN ('terminado', 'entregado')
                        AND fecha_fin IS NOT NULL
                        AND DATE(fecha_fin) < CURDATE()
                        THEN 1 ELSE 0 
                    END) AS atrasados_calculados

                FROM produccion
            """)

            produccion = cursor.fetchone()

            # Resumen de máquinas
            cursor.execute("""
                SELECT
                    COUNT(*) AS total_maquinas,

                    SUM(CASE 
                        WHEN LOWER(estado) = 'si' 
                        THEN 1 ELSE 0 
                    END) AS maquinas_operativas,

                    SUM(CASE 
                        WHEN LOWER(estado) = 'no' 
                        THEN 1 ELSE 0 
                    END) AS maquinas_detenidas

                FROM maquinas
            """)

            maquinas = cursor.fetchone()

        conexion.close()

        return {
            "success": True,
            "message": "Resumen del dashboard obtenido correctamente",
            "resumen": {
                "produccion": {
                    "total_producciones": produccion["total_producciones"] or 0,
                    "pendientes": produccion["pendientes"] or 0,
                    "en_proceso": produccion["en_proceso"] or 0,
                    "pausados": produccion["pausados"] or 0,
                    "terminados": produccion["terminados"] or 0,
                    "entregados": produccion["entregados"] or 0,
                    "atrasados_estado": produccion["atrasados_estado"] or 0,
                    "atrasados_calculados": produccion["atrasados_calculados"] or 0
                },
                "maquinas": {
                    "total_maquinas": maquinas["total_maquinas"] or 0,
                    "maquinas_operativas": maquinas["maquinas_operativas"] or 0,
                    "maquinas_detenidas": maquinas["maquinas_detenidas"] or 0
                }
            }
        }

    except Exception as error:
        return {
            "success": False,
            "message": "Error al obtener resumen del dashboard",
            "error": str(error)
        }