# MongoDB & Backend Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Hackathon Platform - Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB status..." -ForegroundColor Yellow
try {
    $mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
    if ($mongoService) {
        if ($mongoService.Status -eq "Running") {
            Write-Host "✓ MongoDB service is running" -ForegroundColor Green
        } else {
            Write-Host "⚠ MongoDB service exists but is not running" -ForegroundColor Yellow
            Write-Host "  Starting MongoDB service..." -ForegroundColor Yellow
            Start-Service MongoDB
            Start-Sleep -Seconds 2
            if ((Get-Service MongoDB).Status -eq "Running") {
                Write-Host "✓ MongoDB service started successfully" -ForegroundColor Green
            } else {
                Write-Host "✗ Failed to start MongoDB service" -ForegroundColor Red
                Write-Host "  Please start MongoDB manually or use MongoDB Atlas" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "✗ MongoDB service not found" -ForegroundColor Red
        Write-Host ""
        Write-Host "Options:" -ForegroundColor Yellow
        Write-Host "  1. Install MongoDB Community Edition" -ForegroundColor White
        Write-Host "     Download: https://www.mongodb.com/try/download/community" -ForegroundColor White
        Write-Host ""
        Write-Host "  2. Use MongoDB Atlas (Free Cloud Database)" -ForegroundColor White
        Write-Host "     Sign up: https://www.mongodb.com/cloud/atlas/register" -ForegroundColor White
        Write-Host "     Then update backend/.env with your connection string" -ForegroundColor White
        Write-Host ""
        $continue = Read-Host "Do you want to continue anyway? (y/n)"
        if ($continue -ne "y") {
            exit
        }
    }
} catch {
    Write-Host "⚠ Could not check MongoDB service status" -ForegroundColor Yellow
    Write-Host "  Error: $_" -ForegroundColor Yellow
}

Write-Host ""

# Check if .env file exists
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
    
    # Check if MONGO_URI is set
    $envContent = Get-Content "backend\.env" -Raw
    if ($envContent -match "MONGO_URI=.+") {
        Write-Host "✓ MONGO_URI is configured" -ForegroundColor Green
    } else {
        Write-Host "✗ MONGO_URI is not set in .env file" -ForegroundColor Red
        Write-Host "  Please update backend/.env with your MongoDB connection string" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ .env file not found in backend folder" -ForegroundColor Red
    Write-Host "  Creating default .env file..." -ForegroundColor Yellow
    @"
MONGO_URI=mongodb://localhost:27017/hackathon_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
FRONTEND_URL=http://localhost:3001
PORT=5000
"@ | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "✓ Default .env file created" -ForegroundColor Green
    Write-Host "  ⚠ Please verify MONGO_URI is correct for your setup" -ForegroundColor Yellow
}

Write-Host ""

# Install dependencies if needed
Write-Host "Checking backend dependencies..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the backend server
Set-Location backend
npm run dev
