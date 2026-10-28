@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
call npm.cmd run build
if errorlevel 1 goto end
call npm.cmd run preview
:end
pause
