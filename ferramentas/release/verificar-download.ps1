# Baixa uma release do Prumo QA e verifica integridade e assinatura SEM executar o instalador.
# Uso (PowerShell):  .\ferramentas\release\verificar-download.ps1 -Versao 2.18.0
#                    .\ferramentas\release\verificar-download.ps1 -Versao 2.18.0 -Pasta "C:\Prumo QA download"
# Etapas: baixa o .exe e o .sha256 da release oficial, confere o SHA-256 e mostra o estado da assinatura Authenticode.
# Não instala, não executa e não altera proteções do Windows.
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^\d+\.\d+\.\d+$')][string]$Versao,
  [string]$Pasta = (Join-Path $env:USERPROFILE 'Downloads\Prumo QA')
)
$ErrorActionPreference = 'Stop'
$base = "https://github.com/AnaPLysyk/Prumo-Qa/releases/download/v$Versao"
$nome = "Prumo-QA-Setup-$Versao.exe"
New-Item -ItemType Directory -Force $Pasta | Out-Null
$exe = Join-Path $Pasta $nome
$sha = "$exe.sha256"
Invoke-WebRequest "$base/$nome" -OutFile $exe
Invoke-WebRequest "$base/$nome.sha256" -OutFile $sha
$esperado = ((Get-Content $sha -Raw).Trim() -split '\s+')[0].ToLower()
$calculado = (Get-FileHash $exe -Algorithm SHA256).Hash.ToLower()
"Arquivo:   $exe"
"Publicado: $esperado"
"Calculado: $calculado"
if ($esperado -ne $calculado) { throw 'SHA-256 NÃO CONFERE: não execute este arquivo.' }
'SHA-256 confere com o arquivo publicado na release (isto prova integridade, não autoria).'
$ass = Get-AuthenticodeSignature $exe
"Assinatura: $($ass.Status)" + $(if ($ass.SignerCertificate) { " — $($ass.SignerCertificate.Subject)" } else { ' — arquivo sem assinatura digital' })
if ($ass.Status -eq 'NotSigned') { 'O Windows (SmartScreen / Smart App Control) pode alertar ou bloquear a execução de um instalador sem assinatura. Não desative proteções para forçar a execução.' }
