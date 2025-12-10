@echo off
setlocal

REM Change to project directory
cd /d "C:\path\to\Quad-Matrix"

REM Start frontend (silent)
echo Starting frontend...
start "" /B cmd /c "npm run dev"

REM Start backend (silent)
echo Starting backend...
@REM start "" /B cmd /c "npm run server:dev"

exit /b 0