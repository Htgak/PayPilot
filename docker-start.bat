@echo off
echo ============================================================
echo   PayPilot - AI Financial Operations Platform (Docker)
echo ============================================================
echo.
echo Starting PayPilot multi-container services via Docker Compose...
echo.

docker-compose up --build -d

echo.
echo ============================================================
echo   PayPilot services are running!
echo   - Web Dashboard: http://localhost:3000
echo   - API Docs:      http://localhost:8000/docs
echo   - Health Check:  http://localhost:8000/health
echo ============================================================
echo To stop services: docker-compose down
echo To view live logs: docker-compose logs -f
