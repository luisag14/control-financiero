import os
from pathlib import Path

from dotenv import load_dotenv
from psycopg import connect
from psycopg.rows import dict_row

# Carga las variables desde backend/.env.
load_dotenv(Path(__file__).with_name(".env"))


def get_database_url():
    """Obtiene la URL de PostgreSQL desde las variables de entorno."""
    return os.getenv("DATABASE_URL")


def get_connection():
    """Crea una conexion nueva a PostgreSQL."""
    database_url = get_database_url()

    if not database_url:
        raise RuntimeError("Falta configurar la variable de entorno DATABASE_URL")

    return connect(database_url, row_factory=dict_row)
