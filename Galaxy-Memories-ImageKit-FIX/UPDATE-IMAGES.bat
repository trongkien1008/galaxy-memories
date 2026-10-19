@echo off
setlocal
cd /d "%~dp0"

echo Galaxy Memories - ImageKit updater
echo.

where node.exe >nul 2>&1
if errorlevel 1 goto :NO_NODE

if not exist "%~dp0imagekit.private.json" goto :NO_CONFIG

node "%~dp0update-images.mjs"
if errorlevel 1 goto :FAILED

echo.
echo DONE. Open index.html to test the updated gallery.
pause
exit /b 0

:NO_NODE
echo.
echo ERROR: Node.js was not found.
echo Install Node.js 18 or newer, then run this file again.
echo https://nodejs.org/
echo.
pause
exit /b 1

:NO_CONFIG
echo.
echo imagekit.private.json was not found.
echo Opening the setup file now...
call "%~dp0SETUP-IMAGEKIT.bat"
echo.
echo After saving your ImageKit Private Key, run UPDATE-IMAGES.bat again.
pause
exit /b 1

:FAILED
echo.
echo UPDATE FAILED. Read the error message above.
pause
exit /b 1
