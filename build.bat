@echo off
title PayPilot - Production Build
cd /d "%~dp0"

echo ============================================================
echo   PayPilot - Build Verification
echo ============================================================
echo.

echo [1/2] Verifying Backend Python Dependencies & Models...
if exist "apps\api\venv\Scripts\python.exe" (
    apps\api\venv\Scripts\python.exe -c "import apps.api.main; import apps.api.db.database; import apps.api.agents.orchestrator; print('Backend modules verified OK.')"
) else (
    echo [!] Warning: apps\api\venv not found. Run setup.bat first.
)

echo.
echo [2/2] Building Next.js Frontend Bundle...
cd apps\web
call pnpm build
cd ..\..

echo.
echo ============================================================
echo   Build completed!
echo ============================================================
pause
