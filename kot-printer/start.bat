@echo off
title KOT Printer Listener - Sultan Palace Hotel
color 0A

:loop
echo.
echo ====================================
echo   KOT Printer Listener — Starting
echo   %date% %time%
echo ====================================
echo.

cd /d "%~dp0"
set NODE_ENV=production
node index.js

echo.
echo [!] KOT Printer stopped. Restarting in 5 seconds...
echo     Press Ctrl+C to stop permanently.
timeout /t 5 /nobreak >nul
goto loop
