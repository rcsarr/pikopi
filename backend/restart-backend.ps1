Write-Host "=== Restarting Backend on Port 5010 ===" -ForegroundColor Cyan
Write-Host ""

# Stop all Python processes
Write-Host "1. Stopping all Python processes..." -ForegroundColor Yellow
$pythonProcs = Get-Process -Name python -ErrorAction SilentlyContinue
if ($pythonProcs) {
    Write-Host "   Found $($pythonProcs.Count) Python process(es), stopping..." -ForegroundColor Gray
    $pythonProcs | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "   ✅ All Python processes stopped" -ForegroundColor Green
} else {
    Write-Host "   ✅ No Python processes running" -ForegroundColor Green
}

Write-Host ""

# Check port 5010
Write-Host "2. Checking port 5010..." -ForegroundColor Yellow
try {
    $conn = Get-NetTCPConnection -LocalPort 5010 -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "   ⚠️  Port 5010 is still in use!" -ForegroundColor Red
        Write-Host "   Waiting 3 seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
        $conn = Get-NetTCPConnection -LocalPort 5010 -ErrorAction SilentlyContinue
        if ($conn) {
            Write-Host "   ❌ Port 5010 still in use. Please manually stop the process." -ForegroundColor Red
            exit 1
        }
    }
    Write-Host "   ✅ Port 5010 is free" -ForegroundColor Green
} catch {
    Write-Host "   ✅ Port 5010 is free" -ForegroundColor Green
}

Write-Host ""

# Activate virtual environment
Write-Host "3. Activating virtual environment..." -ForegroundColor Yellow
$venvPath = ".\venv\Scripts\Activate.ps1"
if (Test-Path $venvPath) {
    & $venvPath
    Write-Host "   ✅ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "   ❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "   Run: python -m venv venv" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check .env file
Write-Host "4. Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "   Creating from env.example..." -ForegroundColor Gray
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "   ✅ .env file created. Please edit it with your database credentials." -ForegroundColor Green
    } else {
        Write-Host "   ❌ env.example not found!" -ForegroundColor Red
    }
}

Write-Host ""

# Start backend
Write-Host "5. Starting backend on port 5010..." -ForegroundColor Yellow
Write-Host "   Press CTRL+C to stop" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

python run.py

