@echo off
setlocal
set SCRIPT_DIR=%~dp0
REM Build + install to Wi‑Fi device using config defaults
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%dev-all.ps1" -RebuildMobile %*
exit /b %ERRORLEVEL%
