@echo off
cd /d "%~dp0"

echo Iniciando Control Financiero...
echo.
echo 1. Se abrira el backend en otra ventana.
echo 2. Luego se abrira la aplicacion en el navegador.
echo.

start "Backend Control Financiero" cmd /k python "%~dp0backend\app.py"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0verificar_backend.ps1"

if errorlevel 1 (
    echo.
    echo No se abrira el navegador porque el backend no respondio.
    echo Revisa que PostgreSQL este encendido y que la ventana del backend no muestre errores.
    echo.
    pause
    exit /b 1
)

start "" "http://127.0.0.1:5000"

echo Listo. Si la pagina no carga datos, revisa que la ventana del backend siga abierta.
echo.
pause
