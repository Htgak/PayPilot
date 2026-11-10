@echo off
setlocal EnableDelayedExpansion
title PayPilot - AI Financial Operations Platform
cd /d "%~dp0"

echo ============================================================
echo   PayPilot - AI Financial Operations Platform
echo ============================================================
echo.
echo Starting PayPilot Services (FastAPI + Next.js)...
echo.

:: Load environment configuration from .env if present
if exist ".env" (
    for /f "usebackq tokens=1* delims==" %%A in (".env") do (
        set "line=%%A"
        if not "!line:~0,1!"=="#" (
            set "%%A=%%B"
        )
    )
)

if "%DEFAULT_USER_EMAIL%"=="" set "DEFAULT_USER_EMAIL=demouser@gmail.com"
if "%DEFAULT_USER_PASSWORD%"=="" set "DEFAULT_USER_PASSWORD=demouser123"

:: Check for Python venv
if not exist "apps\api\venv\Scripts\python.exe" (
    echo [!] Python virtual environment not found in apps\api\venv.
    echo [*] Running setup.bat to configure dependencies...
    call setup.bat
    if errorlevel 1 goto error
)

:: Check for node_modules in apps\web
if not exist "apps\web\node_modules" (
    echo [!] Web node_modules not found in apps\web.
    echo [*] Installing frontend dependencies...
    cd apps\web
    call pnpm install
    cd ..\..
)

echo [*] Launching FastAPI Backend (http://localhost:8000)...
start "PayPilot - API Server (Port 8000)" cmd /k "cd /d "%~dp0" && apps\api\venv\Scripts\python.exe -m uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload"

echo [*] Waiting for API to initialize...
timeout /t 3 /nobreak >nul

echo [*] Launching Next.js Web Frontend (http://localhost:3000)...
start "PayPilot - Web UI (Port 3000)" cmd /k "cd /d "%~dp0apps\web" && pnpm dev"

echo.
echo ============================================================
echo   PayPilot (Hackathon Demo Mode) is running!
echo.
echo   - Web Dashboard: http://localhost:3000
echo   - AI Assistant:  http://localhost:3000/assistant
echo   - Invoices:      http://localhost:3000/invoices
echo   - API Docs:      http://localhost:8000/docs
echo   - Health Check:  http://localhost:8000/health
echo.
echo   [OK] Demo Mode Active: Instant direct access with .env credentials!
echo ============================================================
echo Press any key to stop all background node and python servers...
pause >nul

echo [*] Stopping servers...
taskkill /F /FI "WINDOWTITLE eq PayPilot - API Server*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PayPilot - Web UI*" /T >nul 2>&1
echo Done.
exit /b 0

:error
echo [!] Failed to start PayPilot.
pause
exit /b 1
