from fastapi import FastAPI

app = FastAPI(
    title="IRONIX Python API",
    description="API Python complementaria para IRONIX/LAGMET",
    version="1.0.0"
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