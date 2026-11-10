@echo off
title PayPilot - Test & Verification Suite
cd /d "%~dp0"

echo ============================================================
echo   PayPilot - Verification & Test Suite
echo ============================================================
echo.

if not exist "apps\api\venv\Scripts\python.exe" (
    echo [!] Python virtual environment not found in apps\api\venv.
    echo [*] Please run setup.bat first.
    pause
    exit /b 1
)

echo [1/2] Running Endpoint & Integration Verification...
echo ------------------------------------------------------------
apps\api\venv\Scripts\python.exe apps\api\tests\verify_endpoints.py

echo.
echo [2/2] Running Frontend TypeScript Typecheck...
echo ------------------------------------------------------------
cd apps\web
call pnpm exec tsc --noEmit
cd ..\..

echo.
echo ============================================================
echo   Test & verification finished!
echo ============================================================
pause
