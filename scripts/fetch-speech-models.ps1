# Downloads the Vosk speech models used by the speech recognition tests into
# .speech-models/ (or -Destination). Then run the tests with:
#   $env:VOSK_MODELS_DIR = "$PWD\.speech-models"; cargo test --manifest-path src-tauri/Cargo.toml
param(
    [string[]]$Languages = @(),
    [string]$Destination = (Join-Path $PSScriptRoot '..\.speech-models')
)

$ErrorActionPreference = 'Stop'

# Keep in sync with src-tauri/src/speech/models.rs
$models = @{
    'en-US' = 'vosk-model-small-en-us-0.15'
    'es-ES' = 'vosk-model-small-es-0.42'
    'fr-FR' = 'vosk-model-small-fr-0.22'
    'de-DE' = 'vosk-model-small-de-0.15'
    'it-IT' = 'vosk-model-small-it-0.22'
    'pt-BR' = 'vosk-model-small-pt-0.3'
    'ja-JP' = 'vosk-model-small-ja-0.22'
    'zh-CN' = 'vosk-model-small-cn-0.22'
    'ko-KR' = 'vosk-model-small-ko-0.22'
}

# By default, the languages that have a test recording
if ($Languages.Count -eq 0) {
    $fixtures = Join-Path $PSScriptRoot '..\src-tauri\tests\fixtures'
    $Languages = Get-ChildItem $fixtures -Filter *.wav | ForEach-Object { $_.BaseName }
}

New-Item -ItemType Directory -Force $Destination | Out-Null
foreach ($language in $Languages) {
    $name = $models[$language]
    if (-not $name) { throw "Unknown language $language" }
    $target = Join-Path $Destination $name
    if (Test-Path (Join-Path $target 'am')) {
        Write-Host "$language already there"
        continue
    }
    $zip = Join-Path $Destination "$name.zip"
    Write-Host "Downloading $name..."
    Invoke-WebRequest "https://alphacephei.com/vosk/models/$name.zip" -OutFile $zip
    Expand-Archive $zip -DestinationPath $Destination -Force
    Remove-Item $zip
}
