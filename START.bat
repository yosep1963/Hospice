@echo off
REM Hospice Chatbot - Simple Startup Script
cd /d "%~dp0"
echo.
echo ============================================================
echo   Hospice Chatbot - Starting...
echo ============================================================
echo.
echo Please wait for initialization (20-30 seconds)
echo.
echo After "Running on local URL" message appears,
echo open your browser to: http://localhost:7860
echo.
echo Press Ctrl+C to stop
echo ============================================================
echo.
venv\Scripts\python.exe app.py
if errorlevel 1 pause
