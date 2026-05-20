@echo off
setlocal
set SCRIPT_DIR=%~dp0
REM Run the PowerShell orchestrator with execution policy bypass so double-click works
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%dev-all.ps1" %*
exit /b %ERRORLEVEL%
