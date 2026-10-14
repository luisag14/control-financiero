$listo = $false

for ($i = 0; $i -lt 20; $i++) {
    try {
        Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:5000/api' -TimeoutSec 1 | Out-Null
        $listo = $true
        break
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $listo) {
    Write-Host 'No se pudo iniciar el backend. Revisa la ventana Backend Control Financiero.'
    exit 1
}

Write-Host 'Backend listo.'
