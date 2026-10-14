from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from db import get_connection

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
TIPOS_VALIDOS = {"ingreso", "gasto"}

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
CORS(app)


def convertir_movimiento(movimiento):
    """Convierte una fila de PostgreSQL a un diccionario serializable."""
    return {
        "id": movimiento["id"],
        "tipo": movimiento["tipo"],
        "descripcion": movimiento["descripcion"],
        "categoria": movimiento["categoria"],
        "monto": float(movimiento["monto"]),
        "fecha": movimiento["fecha"].isoformat(),
        "created_at": movimiento["created_at"].isoformat(),
    }


def respuesta_error(mensaje, estado=400):
    return jsonify({"error": mensaje}), estado


def convertir_fecha(valor, nombre):
    try:
        return date.fromisoformat(valor)
    except (TypeError, ValueError):
        raise ValueError(f"{nombre} debe tener formato YYYY-MM-DD")


def leer_rango_fechas():
    fecha_inicio = request.args.get("fecha_inicio")
    fecha_fin = request.args.get("fecha_fin")

    if fecha_inicio:
        fecha_inicio = convertir_fecha(fecha_inicio, "fecha_inicio")

    if fecha_fin:
        fecha_fin = convertir_fecha(fecha_fin, "fecha_fin")

    if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
        raise ValueError("La fecha de inicio no puede ser mayor que la fecha final")

    condiciones = []
    parametros = []

    if fecha_inicio:
        condiciones.append("fecha >= %s")
        parametros.append(fecha_inicio)

    if fecha_fin:
        condiciones.append("fecha <= %s")
        parametros.append(fecha_fin)

    return condiciones, parametros


def validar_movimiento(datos):
    tipo = datos.get("tipo")
    descripcion = (datos.get("descripcion") or "").strip()
    categoria = (datos.get("categoria") or "").strip()
    monto = datos.get("monto")
    fecha = datos.get("fecha")

    if tipo not in TIPOS_VALIDOS:
        raise ValueError("El tipo debe ser ingreso o gasto")

    if not descripcion or not categoria or monto in (None, "") or not fecha:
        raise ValueError("Faltan datos para crear el movimiento")

    try:
        monto = Decimal(str(monto))
    except (InvalidOperation, TypeError):
        raise ValueError("El monto debe ser un numero valido")

    if monto <= 0:
        raise ValueError("El monto debe ser mayor que cero")

    fecha = convertir_fecha(fecha, "La fecha")

    return {
        "tipo": tipo,
        "descripcion": descripcion,
        "categoria": categoria,
        "monto": monto,
        "fecha": fecha,
    }


@app.get("/")
def inicio():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/api")
def estado_api():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS ok")
            cur.fetchone()

    return jsonify({"mensaje": "API de Control Financiero", "database": "ok"})


@app.get("/movimientos")
def listar_movimientos():
    try:
        condiciones, parametros = leer_rango_fechas()
    except ValueError as error:
        return respuesta_error(str(error))

    filtro = f"WHERE {' AND '.join(condiciones)}" if condiciones else ""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT id, tipo, descripcion, categoria, monto, fecha, created_at
                FROM movimientos
                {filtro}
                ORDER BY fecha DESC, id DESC
                """,
                parametros,
            )
            movimientos = cur.fetchall()

    return jsonify([convertir_movimiento(movimiento) for movimiento in movimientos])


@app.post("/movimientos")
def crear_movimiento():
    try:
        datos = validar_movimiento(request.get_json() or {})
    except ValueError as error:
        return respuesta_error(str(error))

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO movimientos (tipo, descripcion, categoria, monto, fecha)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, tipo, descripcion, categoria, monto, fecha, created_at
                """,
                (
                    datos["tipo"],
                    datos["descripcion"],
                    datos["categoria"],
                    datos["monto"],
                    datos["fecha"],
                ),
            )
            movimiento = cur.fetchone()

    return jsonify(convertir_movimiento(movimiento)), 201


@app.put("/movimientos/<int:movimiento_id>")
def actualizar_movimiento(movimiento_id):
    try:
        datos = validar_movimiento(request.get_json() or {})
    except ValueError as error:
        return respuesta_error(str(error))

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE movimientos
                SET tipo = %s,
                    descripcion = %s,
                    categoria = %s,
                    monto = %s,
                    fecha = %s
                WHERE id = %s
                RETURNING id, tipo, descripcion, categoria, monto, fecha, created_at
                """,
                (
                    datos["tipo"],
                    datos["descripcion"],
                    datos["categoria"],
                    datos["monto"],
                    datos["fecha"],
                    movimiento_id,
                ),
            )
            movimiento = cur.fetchone()

    if movimiento is None:
        return respuesta_error("Movimiento no encontrado", 404)

    return jsonify(convertir_movimiento(movimiento))


@app.delete("/movimientos/<int:movimiento_id>")
def eliminar_movimiento(movimiento_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM movimientos WHERE id = %s RETURNING id",
                (movimiento_id,),
            )
            eliminado = cur.fetchone()

    if eliminado is None:
        return respuesta_error("Movimiento no encontrado", 404)

    return jsonify({"mensaje": "Movimiento eliminado"})


if __name__ == "__main__":
    app.run(debug=False, use_reloader=False)
