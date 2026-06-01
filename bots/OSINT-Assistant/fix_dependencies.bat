@echo off
echo Installing OSINT Assistant dependencies...

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is required but not installed. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Install dependencies
echo Installing required Python packages...
pip install python-dotenv
pip install -r requirements.txt

echo Dependencies installed successfully!
echo.
echo If you were getting "No module named 'dotenv'" error, it should be fixed now.
echo You can now run the application using run_windows.bat or directly with:
echo python osint_web_app.py
echo.
pause 