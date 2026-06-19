# PowerShell script to start the entire ticketing system

Write-Host "Starting Enterprise Ticketing System..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Test database connection first
Write-Host "`nTesting database connection..." -ForegroundColor Cyan
try {
    node test-db-connection.js
    Write-Host "Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "Database connection failed. Please check your MySQL setup." -ForegroundColor Red
    Write-Host "Make sure MySQL is running and check backend/.env credentials" -ForegroundColor Yellow
    Write-Host "`nPress any key to continue anyway..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Install backend dependencies
Write-Host "`nInstalling backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
Set-Location ..

# Install frontend dependencies
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Cyan
npm install

# Check if Angular CLI is installed
try {
    $ngVersion = ng version --skip-git 2>$null
    Write-Host "Angular CLI is available" -ForegroundColor Green
} catch {
    Write-Host "Angular CLI not found. Installing globally..." -ForegroundColor Yellow
    npm install -g @angular/cli
}

# Start backend server
Write-Host "`nStarting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

# Wait a moment for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start frontend development server
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ng serve --open" -WindowStyle Normal

Write-Host "`nSystem is starting up!" -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend will be available at: http://localhost:4200" -ForegroundColor Yellow

Write-Host "`nDefault Login Credentials:" -ForegroundColor Magenta
Write-Host "Admin - Email: admin@presidentsaward.ke | Password: admin123" -ForegroundColor White
Write-Host "User  - Email: user@presidentsaward.ke  | Password: user123" -ForegroundColor White

Write-Host "`nTroubleshooting:" -ForegroundColor Cyan
Write-Host "- If backend fails: Check MySQL connection and credentials" -ForegroundColor Gray
Write-Host "- If frontend fails: Run 'ng serve' manually" -ForegroundColor Gray
Write-Host "- Test backend API: node test-backend.js" -ForegroundColor Gray

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")