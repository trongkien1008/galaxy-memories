@echo off
setlocal
cd /d "%~dp0"

if exist "%~dp0imagekit.private.json" goto :OPEN_CONFIG

copy /Y "%~dp0imagekit.private.example.json" "%~dp0imagekit.private.json" >nul
if errorlevel 1 goto :COPY_FAILED

echo Created imagekit.private.json.
echo Paste your ImageKit PRIVATE KEY into the privateKey field, then save the file.
echo IMPORTANT: Never upload imagekit.private.json to your website or public repository.
echo.
start "" notepad.exe "%~dp0imagekit.private.json"
pause
exit /b 0

:OPEN_CONFIG
echo imagekit.private.json already exists. Opening it now...
start "" notepad.exe "%~dp0imagekit.private.json"
exit /b 0

:COPY_FAILED
echo ERROR: Could not create imagekit.private.json.
echo Make sure this folder is writable and try again.
pause
exit /b 1
