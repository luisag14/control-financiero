# Control Financiero

Aplicacion web para administrar ingresos y gastos personales. Permite registrar movimientos, editar datos, eliminar registros, filtrar por fechas y generar reportes de gasto por categoria.

## Funcionalidades

- Registro de ingresos y gastos.
- Edicion y eliminacion de movimientos.
- Filtro por mes o por rango personalizado de fechas.
- Resumen de ingresos, gastos y balance del periodo.
- Reporte de gastos por categoria, ordenado de mayor a menor.
- Exportacion del reporte a PDF y CSV.
- Backend con Flask y PostgreSQL.
- Frontend construido con HTML, CSS y JavaScript sin frameworks.

## Tecnologias

- Python
- Flask
- PostgreSQL
- Psycopg
- HTML
- CSS
- JavaScript

## Estructura Del Proyecto

- `backend/app.py`: rutas HTTP, validacion y respuestas JSON.
- `backend/db.py`: carga de variables de entorno y conexion a PostgreSQL.
- `backend/.env.example`: plantilla de configuracion local.
- `backend/requirements.txt`: dependencias de Python.
- `database/schema.sql`: estructura necesaria para la tabla `movimientos`.
- `frontend/index.html`: pantalla principal.
- `frontend/reportes.html`: vista de reportes por categoria.
- `frontend/script.js`: comunicacion con la API y comportamiento de la interfaz.
- `frontend/styles.css`: estilos de la aplicacion.
- `abrir_control_financiero.bat`: arranque local del backend y apertura del navegador.
- `verificar_backend.ps1`: comprobacion automatica de disponibilidad del backend.

## Requisitos

- Python 3 instalado.
- PostgreSQL encendido.
- Base de datos creada.
- Variable `DATABASE_URL` configurada en `backend/.env`.
- Dependencias instaladas con `pip install -r backend/requirements.txt`.

## Configuracion

1. Copia `backend/.env.example` como `backend/.env`.
2. Ajusta `DATABASE_URL` con usuario, contrasena, host, puerto y nombre de tu base de datos.
3. Ejecuta el contenido de `database/schema.sql` en PostgreSQL.
4. Instala dependencias:

```bash
pip install -r backend/requirements.txt
```

## Uso Local

1. Enciende PostgreSQL.
2. Ejecuta `abrir_control_financiero.bat`.
3. Usa la aplicacion en `http://127.0.0.1:5000`.
4. Manten abierta la ventana del backend mientras trabajas.

Si la aplicacion no carga datos, revisa que PostgreSQL este activo y que `backend/.env` tenga una `DATABASE_URL` valida.

## API

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/api` | Verifica backend y base de datos. |
| `GET` | `/movimientos` | Lista movimientos. Acepta `fecha_inicio` y `fecha_fin`. |
| `POST` | `/movimientos` | Crea un movimiento. |
| `PUT` | `/movimientos/<id>` | Actualiza un movimiento existente. |
| `DELETE` | `/movimientos/<id>` | Elimina un movimiento. |

## Estado Del Proyecto

Proyecto funcional orientado a portafolio junior. Demuestra CRUD, consumo de API, persistencia en PostgreSQL, filtros, reportes y exportacion de datos en PDF/CSV.
