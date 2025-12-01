# PowerShell Backup Script for EU Dashboard
# Usage: .\backup.ps1

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$sourceDir = "projects/eu_dashboard"
$backupDir = "BACKUP/eu_dashboard_$timestamp"

# Create BACKUP directory if it doesn't exist
if (!(Test-Path "BACKUP")) {
    New-Item -ItemType Directory -Path "BACKUP" | Out-Null
}

Write-Host "Creating backup: $backupDir" -ForegroundColor Green
Write-Host "Copying files..." -ForegroundColor Yellow

# Create backup directory
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Copy files excluding node_modules, dist, build, .git
$excludeDirs = @("node_modules", "dist", "build", ".git")
$excludeFiles = @("*.log", "*.duckdb.wal", ".DS_Store")

# Use robocopy for efficient copying
$excludeDirsArgs = $excludeDirs | ForEach-Object { "/XD", $_ }
$excludeFilesArgs = $excludeFiles | ForEach-Object { "/XF", $_ }

$robocopyArgs = @(
    $sourceDir,
    $backupDir,
    "/E",
    "/NFL",
    "/NDL",
    "/NJH",
    "/NJS",
    "/nc",
    "/ns",
    "/np"
) + $excludeDirsArgs + $excludeFilesArgs

$result = & robocopy @robocopyArgs

# Robocopy exit codes: 0-7 are success, 8+ are errors
if ($LASTEXITCODE -lt 8) {
    Write-Host "✓ Backup completed successfully!" -ForegroundColor Green
    Write-Host "Location: $backupDir" -ForegroundColor Cyan

    # Show backup size
    $size = (Get-ChildItem -Path $backupDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host ("Size: {0:N2} MB" -f $size) -ForegroundColor Cyan
} else {
    Write-Host "✗ Backup failed! Exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
