Write-Host "Stopping MediFind backend services..." -ForegroundColor Yellow

Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "All MediFind backend services stopped." -ForegroundColor Green