@echo off
REM ============================================
REM GE Project Setup Script (Windows)
REM ============================================

echo.
echo === Installing git hooks ===
git config core.hooksPath .githooks

echo.
echo === Setting up Python virtual environment ===
if not exist "backend\venv\Scripts\python.exe" (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

echo.
echo === Installing Python dependencies ===
cd backend
call venv\Scripts\activate
pip install -r requirements.txt
python -m pip install python-dotenv
cd ..

echo.
echo === Setting up environment file ===
if not exist "backend\.env" (
    copy backend\.env.example backend\.env
    echo Created .env from .env.example - review and adjust as needed.
)

echo.
echo === Running database migrations ===
cd backend
call venv\Scripts\activate
python manage.py migrate
cd ..

echo.
echo === Creating initial backup ===
cd backend
call venv\Scripts\activate
python manage.py backup_restore backup
cd ..

echo.
echo === Setup complete! ===
echo.
echo Available commands:
echo   backend\backup.bat              - Create database backup
echo   backend\backup.bat restore      - Restore from backup
echo   cd backend ^&^& venv\Scripts\activate ^&^& python manage.py runserver
echo   cd frontend ^&^& npm run dev
echo.
