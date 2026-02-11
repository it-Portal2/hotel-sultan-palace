@echo off
title KOT Printer — PM2 Setup
color 0A

echo.
echo ====================================
echo   KOT Printer — PM2 Setup
echo   Sultan Palace Hotel
echo ====================================
echo.

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node --version

:: Install dependencies
echo.
echo [1/5] Installing project dependencies...
cd /d "%~dp0"
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)
echo [OK] Dependencies installed

:: Install PM2 globally
echo.
echo [2/5] Installing PM2 globally...
call npm install -g pm2
if errorlevel 1 (
    echo [ERROR] PM2 install failed! Try running as Administrator.
    pause
    exit /b 1
)
echo [OK] PM2 installed

:: Install PM2 Windows startup module
echo.
echo [3/5] Installing PM2 Windows startup module...
call npm install -g pm2-windows-startup
echo [OK] PM2 startup module installed

:: Create logs directory
echo.
echo [4/5] Creating logs directory...
if not exist logs mkdir logs
echo [OK] Logs directory ready

:: Start with PM2
echo.
echo [5/5] Starting KOT Printer with PM2...
call pm2 start ecosystem.config.js
if errorlevel 1 (
    echo [ERROR] PM2 start failed!
    pause
    exit /b 1
)

:: Setup auto-start on boot
echo.
echo Setting up auto-start on Windows boot...
call pm2-startup install
call pm2 save

echo.
echo ====================================
echo   SETUP COMPLETE!
echo ====================================
echo.
echo The KOT Printer is now running and will
echo auto-start when this PC is turned on.
echo.
echo Useful commands:
echo   pm2 status             — Check status
echo   pm2 logs kot-printer   — View live logs
echo   pm2 restart kot-printer — Restart
echo   pm2 stop kot-printer   — Stop
echo.
pause
