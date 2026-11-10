@echo off
title PayPilot - Database Seeder
cd /d "%~dp0"

echo ============================================================
echo   PayPilot - Database Seeder & Demo User Provisioning
echo ============================================================
echo.

if not exist "apps\api\venv\Scripts\python.exe" (
    echo [!] Python virtual environment not found in apps\api\venv.
    echo [*] Please run setup.bat first.
    pause
    exit /b 1
)

echo [*] Seeding demo data (profile, customers, invoices, transactions, approvals)...
echo [*] Provisioning default user from .env locally and in Supabase...
echo.
apps\api\venv\Scripts\python.exe apps\api\db\seed.py

echo.
if errorlevel 1 (
    echo [!] Database seeding failed.
) else (
    echo [OK] Database seeded successfully.
)
echo.
pause
