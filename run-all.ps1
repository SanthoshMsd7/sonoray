Write-Host "Starting UltaServe ERP in Production Mode..."

# 1. Start Backend
Write-Host "Starting Backend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# 2. Build and Start Frontend
Write-Host "Building Frontend..."
cd frontend
npm run build
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run start"
cd ..

Write-Host "Waiting for tunnel..."
Start-Sleep -Seconds 5

# 3. Start Cloudflare Tunnel
cloudflared tunnel --url http://localhost:3000
