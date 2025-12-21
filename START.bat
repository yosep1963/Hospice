@echo off
chcp 65001 >nul 2>&1
REM Hospice Chatbot - Simple Startup Script
cd /d "%~dp0"
echo.
echo ============================================================
echo   Hospice Chatbot - Starting...
echo ============================================================
echo.
echo Please wait for initialization (20-30 seconds)
echo.
echo After initialization, open browser to:
echo   http://localhost:7860
echo.
echo Press Ctrl+C to stop the server
echo ============================================================
echo.

REM Check if venv exists
if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found!
    echo Please run setup.bat first.
    pause
    exit /b 1
)

REM Run the app
venv\Scripts\python.exe app.py

REM Keep window open if error occurred
if errorlevel 1 (
    echo.
    echo ============================================================
    echo [ERROR] Application stopped unexpectedly.
    echo Check the error message above.
    echo ============================================================
    pause
)
