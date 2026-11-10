@echo off
title PayPilot - Web Frontend
cd /d "%~dp0apps\web"

echo ============================================================
echo   PayPilot - Web Frontend (Next.js 14)
echo ============================================================
echo.

if not exist "node_modules" (
    echo [*] Installing node dependencies...
    call pnpm install
)

echo [*] Starting Next.js on http://localhost:3000...
echo.
call pnpm dev
