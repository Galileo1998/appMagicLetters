param(
  [int]$Port = 8082,
  [string]$NgrokPath = $env:NGROK_PATH
)

$ErrorActionPreference = "Stop"
$ngrokProcess = $null

function Stop-LocalNgrok {
  if ($null -ne $script:ngrokProcess -and -not $script:ngrokProcess.HasExited) {
    Stop-Process -Id $script:ngrokProcess.Id -ErrorAction SilentlyContinue
    Wait-Process -Id $script:ngrokProcess.Id -Timeout 5 -ErrorAction SilentlyContinue
  }
}

try {
  $ngrokExecutable = $null
  $detectedVersions = @()
  $ngrokCandidates = @()

  $projectNgrok = Join-Path $PSScriptRoot "..\.tools\ngrok\ngrok.exe"
  $ngrokCandidates += Get-Item -LiteralPath $projectNgrok -ErrorAction SilentlyContinue
  if ($NgrokPath) {
    $ngrokCandidates += Get-Item -LiteralPath $NgrokPath -ErrorAction SilentlyContinue
  }
  $ngrokCandidates += Get-Command ngrok -All -ErrorAction SilentlyContinue

  foreach ($candidate in $ngrokCandidates) {
    $candidatePath = if ($candidate.Source) { $candidate.Source } else { $candidate.FullName }
    if (-not $candidatePath) {
      continue
    }

    $candidateVersion = (& $candidatePath version 2>&1 | Out-String).Trim()
    $detectedVersions += "$candidatePath ($candidateVersion)"
    if ($LASTEXITCODE -eq 0 -and $candidateVersion -match "ngrok version 3\.") {
      $ngrokExecutable = $candidatePath
      break
    }
  }

  if (-not $ngrokExecutable) {
    $detectedText = if ($detectedVersions.Count) {
      $detectedVersions -join "`n"
    } else {
      "ninguna"
    }
    throw @"
No se encontro Ngrok v3.
Versiones detectadas:
$detectedText

Instalalo desde https://ngrok.com/download/windows y luego ejecuta:
  ngrok config add-authtoken TU_TOKEN
"@
  }

  & $ngrokExecutable config check | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "La configuracion de Ngrok no es valida. Ejecuta: ngrok config add-authtoken TU_TOKEN"
  }

  $ngrokLog = Join-Path $env:TEMP "magicletter-ngrok-$PID.log"
  $ngrokArgs = @(
    "http",
    "$Port",
    "--log=$ngrokLog",
    "--log-format=json"
  )

  Write-Host "Iniciando tunel Ngrok para el puerto $Port..."
  $ngrokProcess = Start-Process `
    -FilePath $ngrokExecutable `
    -ArgumentList $ngrokArgs `
    -PassThru `
    -WindowStyle Hidden

  $publicUrl = $null
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if ($ngrokProcess.HasExited) {
      $details = if (Test-Path $ngrokLog) {
        (Get-Content $ngrokLog -Tail 20 | Out-String).Trim()
      } else {
        "Ngrok termino sin generar un registro."
      }
      throw "Ngrok no pudo iniciar.`n$details"
    }

    try {
      $tunnels = Invoke-RestMethod `
        -Uri "http://127.0.0.1:4040/api/tunnels" `
        -TimeoutSec 2
      $publicUrl = $tunnels.tunnels |
        Where-Object { $_.public_url -like "https://*" } |
        Select-Object -First 1 -ExpandProperty public_url
      if ($publicUrl) {
        break
      }
    } catch {
      # La API local tarda unos segundos en estar disponible.
    }

    Start-Sleep -Milliseconds 500
  }

  if (-not $publicUrl) {
    throw "Ngrok inicio, pero no publico una URL HTTPS."
  }

  $env:EXPO_PACKAGER_PROXY_URL = $publicUrl
  Write-Host ""
  Write-Host "Tunel listo: $publicUrl" -ForegroundColor Green
  Write-Host "Expo Go usara esta direccion mientras esta ventana permanezca abierta."
  Write-Host ""

  & npx.cmd expo start --localhost --go --port $Port --clear
  if ($LASTEXITCODE -ne 0) {
    throw "Expo termino con el codigo $LASTEXITCODE."
  }
} catch {
  Write-Error $_
  exit 1
} finally {
  Stop-LocalNgrok
  Remove-Item Env:EXPO_PACKAGER_PROXY_URL -ErrorAction SilentlyContinue
}
