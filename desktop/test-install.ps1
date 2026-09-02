$ErrorActionPreference = "Stop"
$installer = Get-ChildItem "$PSScriptRoot/release/*Setup.exe" | Select-Object -First 1
if (!$installer) { throw "Installer not found" }
$testRoot = Join-Path $env:RUNNER_TEMP "StudyPilot Install Test"
$installDirectory = Join-Path $testRoot "Application"
$dataDirectory = Join-Path $testRoot "Chinese 用户 Data"
New-Item -ItemType Directory -Force $testRoot | Out-Null
$install = Start-Process -FilePath $installer.FullName -ArgumentList "/S", "/D=$installDirectory" -Wait -PassThru
if ($install.ExitCode -ne 0) { throw "Installation failed" }
$application = Join-Path $installDirectory "StudyPilot AI.exe"
if (!(Test-Path $application)) { throw "Installed executable missing" }
foreach ($marker in @("first-start-ok.txt", "restart-ok.txt")) {
  $process = Start-Process -FilePath $application -ArgumentList "`"--smoke-directory=$dataDirectory`"" -PassThru
  if (!$process.WaitForExit(240000)) {
    Stop-Process -Id $process.Id -Force
    throw "Installed app timed out"
  }
  if (Test-Path "$dataDirectory/failure.txt") { Get-Content "$dataDirectory/failure.txt" }
  if (!(Test-Path (Join-Path $dataDirectory $marker))) { throw "Installed app smoke test failed: $marker" }
}
Get-FileHash $installer.FullName -Algorithm SHA256 | Format-List
