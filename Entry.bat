@echo off
setlocal enabledelayedexpansion

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%Quad-Matrix"

REM Change to project directory
cd /d "%PROJECT_DIR%"

REM Verify package.json exists
if not exist package.json (
    echo.
    echo ERROR: Could not find package.json
    echo Looking in: %cd%
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   QuadMatrix - Starting Servers
echo ========================================
echo.
echo Project Directory: %cd%
echo.

REM Start frontend dev server in new Windows Terminal tab
echo Starting Frontend Server (npm run dev)...
start "" wt new-tab -d "%cd%" cmd /c "npm run dev & pause"

REM Wait for first tab to start
timeout /t 2 /nobreak

REM Start backend server in new Windows Terminal tab
echo Starting Backend Server (npm run server:dev)...
start "" wt new-tab -d "%cd%" cmd /c "npm run server:dev & pause"

echo.
echo ========================================
echo ✓ Both servers starting in new tabs
echo ✓ Frontend: http://localhost:8080
echo ✓ Backend: http://localhost:5000
echo ========================================
echo.
timeout /t 2 /nobreak