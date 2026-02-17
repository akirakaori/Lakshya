@echo off
echo ========================================
echo STARTING RESUME PARSER SERVICE
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found!
    echo.
    echo Please run setup first:
    echo   1. python -m venv venv
    echo   2. venv\Scripts\activate
    echo   3. pip install -r requirements.txt
    echo   4. python -m spacy download en_core_web_sm
    echo.
    pause
    exit /b 1
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if spaCy model is installed
python -c "import spacy; spacy.load('en_core_web_sm')" 2>nul
if errorlevel 1 (
    echo ERROR: spaCy model not found!
    echo.
    echo Downloading spaCy model...
    python -m spacy download en_core_web_sm
    if errorlevel 1 (
        echo Failed to download spaCy model
        pause
        exit /b 1
    )
)

echo.
echo Starting FastAPI service on http://localhost:8000
echo Press Ctrl+C to stop
echo.

REM Start the service
python main.py
