#!/bin/bash

echo "========================================"
echo "STARTING RESUME PARSER SERVICE"
echo "========================================"
echo ""

# Check if virtual environment exists
if [ ! -f "venv/bin/activate" ]; then
    echo "ERROR: Virtual environment not found!"
    echo ""
    echo "Please run setup first:"
    echo "  1. python3 -m venv venv"
    echo "  2. source venv/bin/activate"
    echo "  3. pip install -r requirements.txt"
    echo "  4. python -m spacy download en_core_web_sm"
    echo ""
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if spaCy model is installed
python -c "import spacy; spacy.load('en_core_web_sm')" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "ERROR: spaCy model not found!"
    echo ""
    echo "Downloading spaCy model..."
    python -m spacy download en_core_web_sm
    if [ $? -ne 0 ]; then
        echo "Failed to download spaCy model"
        exit 1
    fi
fi

echo ""
echo "Starting FastAPI service on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

# Start the service
python main.py
