@echo off
echo Starting OSINT Assistant setup...

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is required but not installed. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Install key dependencies first to avoid common errors
echo Installing critical dependencies...
pip install python-dotenv

REM Install all other dependencies
echo Installing remaining dependencies...
pip install -r requirements.txt

REM Check if .env file exists
if not exist .env (
    echo Creating .env file from example...
    copy .env.example .env
    echo Please edit the .env file and add your API key.
)

REM Check if React app is built
if not exist "client\build" (
    echo React app is not built. Building now...
    
    REM Check if Node.js is installed
    where npm >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo Node.js and npm are required to build the frontend. Running with backend only...
    ) else (
        cd client
        call npm install
        call npm run build
        cd ..
    )
)

REM Start the Flask server and open browser
echo Starting OSINT Assistant Web App...
start "" http://localhost:5000
python osint_web_app.py

pause 