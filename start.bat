@echo off
setlocal EnableDelayedExpansion
title Zenzy Clothing Wear - POS and Database System
cd /d "%~dp0"

echo ========================================================
echo       Zenzy Clothing Wear - System Launcher
echo ========================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 goto NO_NODE

:: 2. Check if npm is installed
where npm >nul 2>&1
if %errorlevel% neq 0 goto NO_NPM

echo [1/5] Node.js and npm detected successfully.

:: 3. Read configuration from .env or create it from .env.example
set APP_PORT=3000
set DB_PORT=3306
set DB_HOST=localhost

if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [INFO] Created default .env from .env.example
    )
)

if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        set "KEY=%%a"
        set "VAL=%%b"
        if "!KEY!"=="PORT" set "APP_PORT=!VAL!"
        if "!KEY!"=="DB_PORT" set "DB_PORT=!VAL!"
        if "!KEY!"=="DB_HOST" set "DB_HOST=!VAL!"
    )
)

echo [2/5] Configuration: Web Port !APP_PORT!, DB !DB_HOST!:!DB_PORT!

:: 4. Check dependencies
if exist "node_modules" goto DEPS_OK
echo [3/5] Installing dependencies via npm install...
call npm install
if %errorlevel% neq 0 goto NPM_ERR
echo       Dependencies installed successfully.
:DEPS_OK
echo [3/5] Dependencies verified.

:: 5. Test MySQL / MariaDB Server Reachability
echo [4/5] Checking database connection on !DB_HOST!:!DB_PORT!...
node -e "const net = require('net'); const s = net.createConnection({ port: parseInt('!DB_PORT!'), host: '!DB_HOST!' }, () => { s.end(); process.exit(0); }); s.on('error', () => process.exit(1));" >nul 2>&1
if %errorlevel% neq 0 goto DB_WARN
echo       Database server detected on !DB_HOST!:!DB_PORT!.
goto LAUNCH

:DB_WARN
echo.
echo ========================================================
echo  [WARNING] MySQL / MariaDB is NOT reachable on !DB_HOST!:!DB_PORT!
echo ========================================================
echo  The application requires MySQL or MariaDB to store sales records.
echo.
echo  Troubleshooting steps:
echo   1. Start your database service:
echo      - If using XAMPP or WAMP: Open control panel and click Start next to MySQL.
echo      - If using Windows Service: Run 'net start MySQL' or 'net start MariaDB'.
echo   2. Check your port in '.env':
echo      - Standard MySQL port is 3306.
echo   3. If needed, import 'schema.sql' into your MySQL server.
echo.
set START_CHOICE=Y
set /p START_CHOICE="  Do you still want to start the web server? [Y/N, default Y]: "
if /i "!START_CHOICE!"=="N" goto CANCELLED
goto LAUNCH

:LAUNCH
:: Check if Web Port is already listening from a previous instance
node -e "const net = require('net'); const s = net.createConnection({ port: parseInt('!APP_PORT!'), host: '127.0.0.1' }, () => { s.end(); process.exit(0); }); s.on('error', () => process.exit(1));" >nul 2>&1
if %errorlevel% equ 0 (
    echo [NOTICE] Port !APP_PORT! is currently occupied by a previous process.
    echo Closing previous instance on port !APP_PORT!...
    for /f "tokens=5" %%p in ('netstat -aon ^| findstr :!APP_PORT! ^| findstr LISTENING') do (
        taskkill /F /PID %%p >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

echo.
echo [5/5] Launching Zenzy Clothing Wear on http://localhost:!APP_PORT!...
start http://localhost:!APP_PORT!

echo.
echo ========================================================
echo   Zenzy Clothing Wear Server is running!
echo   Press Ctrl+C in this terminal window to stop the server.
echo ========================================================
echo.
node server.js
if %errorlevel% neq 0 (
    echo.
    echo [SERVER TERMINATED WITH EXIT CODE %errorlevel%]
)
pause
exit /b 0

:NO_NODE
echo [ERROR] Node.js is not installed or not found in system PATH!
echo.
echo Please install Node.js from https://nodejs.org/
echo After installing Node.js, run this file again.
echo.
pause
exit /b 1

:NO_NPM
echo [ERROR] npm was not found in your system PATH!
echo Please verify your Node.js and npm installation.
echo.
pause
exit /b 1

:NPM_ERR
echo [ERROR] Failed to install dependencies via npm install.
echo Please check your internet connection and run npm install manually.
echo.
pause
exit /b 1

:CANCELLED
echo.
echo Startup cancelled. Start your database service and run start.bat again.
pause
exit /b 0
