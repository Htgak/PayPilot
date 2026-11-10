@echo off
setlocal EnableDelayedExpansion
title PayPilot - Complete Workspace Setup
cd /d "%~dp0"

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

echo ============================================================
echo   PayPilot - Full Project Setup & Installation
echo ============================================================
echo.

:: 1. Backend virtual environment
echo [1/4] Setting up Python virtual environment...
if not exist "apps\api\venv\Scripts\python.exe" (
    python -m venv apps\api\venv
    if errorlevel 1 (
        echo [!] Failed to create Python virtual environment. Ensure Python 3.10+ is installed and in PATH.
        pause
        exit /b 1
    )
    echo [+] Created virtual environment in apps\api\venv.
) else (
    echo [+] Virtual environment already exists.
)

:: 2. Backend dependencies
echo.
echo [2/4] Installing Python requirements...
apps\api\venv\Scripts\python.exe -m pip install --upgrade pip
apps\api\venv\Scripts\pip.exe install -r apps\api\requirements.txt

:: 3. Frontend dependencies
echo.
echo [3/4] Installing Web frontend dependencies with pnpm...
cd apps\web
call pnpm install
cd ..\..

:: 4. Database seed
echo.
echo [4/4] Seeding database with demo records & user...
apps\api\venv\Scripts\python.exe apps\api\db\seed.py

echo.
echo ============================================================
echo   Setup completed successfully!
echo.
echo   To launch PayPilot, run:
echo     start.bat
echo.
echo   Default Login Credentials (from .env):
echo     Email:    !DEFAULT_USER_EMAIL!
echo     Password: !DEFAULT_USER_PASSWORD!
echo ============================================================
pause
