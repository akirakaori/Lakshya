# Resume Parser Service

A FREE resume parsing microservice built with FastAPI and spaCy that extracts structured data from PDF/DOCX resumes.

## Features

- ✅ **Zero Cost**: Uses only free, open-source libraries
- 📄 **Multi-Format Support**: Handles PDF and DOCX files
- 🧠 **NLP-Powered**: Uses spaCy for intelligent text extraction
- 🔍 **Comprehensive Skill Detection**: Matches 100+ technical and soft skills
- 📊 **Section Extraction**: Identifies Education, Experience, Summary sections
- ⚡ **Fast & Lightweight**: Built on FastAPI for high performance

## Prerequisites

- Python 3.8 or higher
- pip package manager

## Installation

### 1. Create Virtual Environment (Recommended)

```bash
cd resume-parser-service
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Download spaCy Language Model

**IMPORTANT**: You must download the spaCy English model before running the service.

```bash
python -m spacy download en_core_web_sm
```

This downloads a ~13MB English language model for NLP processing.

### 4. Verify Installation

```bash
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('✓ spaCy model loaded successfully')"
```

## Running the Service

### Start the server:

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service will start on **http://localhost:8000**

### Check if it's running:

Visit http://localhost:8000 in your browser. You should see:

```json
{
  "status": "healthy",
  "service": "Resume Parser",
  "spacy_loaded": true
}
```

## API Documentation

### Endpoint: `POST /parse-resume`

**Request Body:**
```json
{
  "resumeUrl": "https://res.cloudinary.com/your-cloud/raw/authenticated/resumes/resume_123.pdf"
}
```

**Response:**
```json
{
  "title": "Senior Software Engineer",
  "skills": ["python", "javascript", "react", "node.js", "mongodb"],
  "education": "Bachelor of Science in Computer Science\nUniversity Name, 2018",
  "experience": "Software Engineer at Company XYZ\n2019-2023\n- Led development of web applications",
  "summary": "Experienced software engineer with 5+ years in full-stack development...",
  "experienceYears": 5
}
```

## Integration with Node.js Backend

After starting this service, your Node.js backend will call it automatically after resume upload. See the backend integration code in:

- `lakshyabackend/Services/resume-parser-service.js` - Service to call Python API
- `lakshyabackend/Controller/user-controller.js` - Integration in upload flow

## Technology Stack

- **FastAPI**: Modern, fast web framework
- **spaCy**: Industrial-strength NLP library
- **pdfplumber**: PDF text extraction
- **docx2txt**: Word document parsing
- **Pydantic**: Data validation

## Skill Detection

The parser recognizes 100+ skills across:
- Programming Languages (Python, JavaScript, Java, etc.)
- Web Frameworks (React, Node.js, Django, etc.)
- Databases (MongoDB, PostgreSQL, MySQL, etc.)
- Cloud & DevOps (AWS, Docker, Kubernetes, etc.)
- Mobile Development (Android, iOS, React Native, etc.)
- Data Science & AI (Machine Learning, TensorFlow, etc.)
- Soft Skills (Leadership, Communication, etc.)

## Troubleshooting

### Error: "spaCy model not found"
**Solution**: Run `python -m spacy download en_core_web_sm`

### Error: "No module named 'spacy'"
**Solution**: Ensure virtual environment is activated and run `pip install -r requirements.txt`

### Error: Port 8000 already in use
**Solution**: Change port in `main.py` or kill the process using port 8000

## Development

### Running in Development Mode with Auto-Reload:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing the API:

Use the interactive API docs at http://localhost:8000/docs (Swagger UI)

## Production Deployment

For production, consider:
1. Use a process manager (PM2, systemd, supervisor)
2. Run behind a reverse proxy (nginx, Apache)
3. Increase workers: `uvicorn main:app --workers 4`
4. Enable HTTPS
5. Set up proper logging

## License

MIT License - Free to use and modify
