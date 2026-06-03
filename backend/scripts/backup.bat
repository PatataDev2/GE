@echo off
REM ============================================
REM Database Backup Script for GE (Windows)
REM ============================================
REM Usage:
REM   backup.bat              - Create a timestamped backup
REM   backup.bat myfile.json  - Save backup to a specific file
REM   backup.bat restore      - Restore from a backup file (will prompt)
REM   backup.bat restore mybackup.json - Restore without prompt
REM ============================================

cd /d "%~dp0.."

if /I "%1"=="restore" (
    if "%2"=="" (
        echo Available backups:
        dir /b backups\*.json 2>nul
        if errorlevel 1 echo No backups found in backups\ directory.
        echo.
        set /p FILE="Enter backup file path: "
    ) else (
        set FILE=%2
    )
    if "%FILE%"=="" exit /b 1
    call venv\Scripts\activate
    python manage.py backup_restore restore --input "%FILE%"
    goto :eof
)

if "%1"=="" (
    call venv\Scripts\activate
    python manage.py backup_restore backup
    goto :eof
)

call venv\Scripts\activate
python manage.py backup_restore backup --output "%1"
