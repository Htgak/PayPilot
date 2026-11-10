@echo off
title PayPilot - Backend API Server
cd /d "%~dp0"

echo ============================================================
echo   PayPilot - Backend API Server (FastAPI)
echo ============================================================
echo.

if not exist "apps\api\venv\Scripts\python.exe" (
    echo [!] Python virtual environment not found in apps\api\venv.
    echo [*] Please run setup.bat first.
    pause
    exit /b 1
)

echo [*] Starting FastAPI on http://localhost:8000 with auto-reload...
echo [*] Interactive Docs: http://localhost:8000/docs
echo [*] Health Endpoint:  http://localhost:8000/health
echo.
apps\api\venv\Scripts\python.exe -m uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload
