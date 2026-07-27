$ErrorActionPreference = "Stop"
$ngrokExecutable = Join-Path $PSScriptRoot "..\.tools\ngrok\ngrok.exe"

if (-not (Test-Path -LiteralPath $ngrokExecutable)) {
  Write-Error @"
No se encontro el agente Ngrok del proyecto.
Descargalo desde https://ngrok.com/download/windows o vuelve a ejecutar la instalacion del proyecto.
"@
  exit 1
}

Write-Host "Abre https://dashboard.ngrok.com/get-started/your-authtoken"
Write-Host "Copia tu authtoken y pegalo abajo. La entrada permanecera oculta."
$secureToken = Read-Host "Authtoken de Ngrok" -AsSecureString

if ($secureToken.Length -eq 0) {
  Write-Error "No se ingreso ningun authtoken."
  exit 1
}

$tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
$plainToken = $null

try {
  $plainToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
  & $ngrokExecutable config add-authtoken $plainToken
  if ($LASTEXITCODE -ne 0) {
    throw "Ngrok no pudo guardar el authtoken."
  }

  & $ngrokExecutable config check
  if ($LASTEXITCODE -ne 0) {
    throw "Ngrok guardo el token, pero la configuracion no es valida."
  }

  Write-Host ""
  Write-Host "Ngrok quedo configurado para este usuario." -ForegroundColor Green
  Write-Host "Ahora ejecuta: npm run start:tunnel"
} catch {
  Write-Error $_
  exit 1
} finally {
  $plainToken = $null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
}
