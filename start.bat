@echo off
cd /d "%~dp0"
python -m pip install -r requirements.txt
if errorlevel 1 (
  pause
  exit /b 1
)
where ffmpeg >nul 2>&1
if errorlevel 1 echo FFmpeg not found. Install with: winget install Gyan.FFmpeg
start "" http://localhost:8080
python server.py
pause
