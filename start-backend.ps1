Write-Host "Starting Eureka Discovery Server..."
Start-Process "mvn.cmd" -ArgumentList "spring-boot:run -pl discovery-server" -WorkingDirectory "d:\medifind"
Start-Sleep -Seconds 15

Write-Host "Starting API Gateway..."
Start-Process "mvn.cmd" -ArgumentList "spring-boot:run -pl api-gateway" -WorkingDirectory "d:\medifind"
Start-Sleep -Seconds 10

Write-Host "Starting Auth Service..."
Start-Process "mvn.cmd" -ArgumentList "spring-boot:run -pl auth-service" -WorkingDirectory "d:\medifind"
Start-Sleep -Seconds 5

Write-Host "Starting User Service (Optional for full profile)..."
Start-Process "mvn.cmd" -ArgumentList "spring-boot:run -pl user-service" -WorkingDirectory "d:\medifind"

Write-Host "Backend services started in separate windows. Please wait a moment for them to fully initialize."
