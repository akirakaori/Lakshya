# 🚀 Quick Start Guide - Resume Parser Integration

## What Was Built

✅ **FREE Resume Parser** using Python + spaCy  
✅ **FastAPI Microservice** for resume parsing  
✅ **Node.js Integration** with existing backend  
✅ **Auto-fill Profile** after resume upload  
✅ **Zero Breaking Changes** to existing code  

## 📁 New Files Created

### Python Service (`resume-parser-service/`)
```
resume-parser-service/
├── main.py              # FastAPI service with spaCy NLP
├── requirements.txt     # Python dependencies
├── README.md           # Python service documentation
├── .gitignore          # Python gitignore
├── start.bat           # Windows startup script
├── start.sh            # Mac/Linux startup script
└── test_service.py     # Service health test
```

### Node.js Integration (`lakshyabackend/`)
```
Services/
└── resume-parser-service.js  # Calls Python API, auto-fills profile
```

### Modified Files
```
Controller/user-controller.js  # Added parser call after upload
```

## ⚡ Quick Setup (5 minutes)

### 1️⃣ Setup Python Service

```bash
cd resume-parser-service

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model (REQUIRED!)
python -m spacy download en_core_web_sm
```

### 2️⃣ Start Services

**Terminal 1 - Python Parser:**
```bash
cd resume-parser-service
venv\Scripts\activate
python main.py
```
✅ Service running at: http://localhost:8000

**Terminal 2 - Node.js Backend:**
```bash
cd lakshyabackend
npm start
```

**Terminal 3 - React Frontend:**
```bash
cd lakshyafrontend
npm run dev
```

## 🧪 Test It Out

1. Login as a **Job Seeker**
2. Go to **Profile** page
3. Click **Upload Resume**
4. Select a PDF/DOCX resume
5. Watch your profile auto-fill! 🎉

**Expected Result:**
- Title extracted
- Skills detected (technical + soft)
- Education section filled
- Experience section filled
- Summary/bio populated

## 📊 How It Works

```
User uploads resume (PDF/DOCX)
        ↓
Node.js uploads to Cloudinary ✅
        ↓
Calls Python parser with resume URL
        ↓
Python extracts text + parses with spaCy
        ↓
Returns: { title, skills, education, experience, summary }
        ↓
Node.js auto-fills EMPTY profile fields only
        ↓
Frontend refreshes → User sees filled profile ✅
```

## 🔍 Verification

### Check Python Service:
```bash
curl http://localhost:8000
```

Expected:
```json
{
  "status": "healthy",
  "service": "Resume Parser",
  "spacy_loaded": true
}
```

### Check Backend Logs:

After resume upload, you should see:
```
🤖 Attempting to auto-fill profile from resume...
=== CALLING RESUME PARSER SERVICE ===
Parser response: { "title": "...", "skills": [...], ... }
✅ Profile auto-filled successfully! Updated 5 fields
```

## 🛡️ Safety Features

✅ **Non-blocking**: Parser failure doesn't break upload  
✅ **Smart merge**: Only fills EMPTY fields  
✅ **Graceful degradation**: Works even if parser is down  
✅ **No overwrites**: Never replaces user-entered data  

## 🎯 What Gets Extracted

| Field | Source |
|-------|--------|
| **Title** | Job title near top of resume |
| **Skills** | Matches 100+ tech/soft skills |
| **Education** | "Education" section |
| **Experience** | "Experience"/"Work History" section |
| **Summary** | "Summary"/"Objective" section |
| **Years** | "5+ years experience" patterns |

## 🔧 Troubleshooting

### Parser not running?
```bash
cd resume-parser-service
venv\Scripts\activate
python main.py
```

### spaCy model missing?
```bash
python -m spacy download en_core_web_sm
```

### Profile not updating?
- Check backend logs for `🤖 Attempting to auto-fill...`
- Refresh browser
- Make sure profile fields are empty (parser only fills empty fields)

## 📚 Full Documentation

See **[RESUME_PARSER_SETUP.md](../RESUME_PARSER_SETUP.md)** for:
- Detailed architecture
- Production deployment
- Advanced configuration
- Custom skill lists
- Performance tuning

## 💰 Cost

**Total: $0** (100% free and open-source)

vs Paid alternatives: **Save $1,000-$10,000/month**

## 🎓 Tech Stack

- **Python 3.8+** - Runtime
- **FastAPI** - Web framework
- **spaCy** - NLP engine
- **pdfplumber** - PDF parsing
- **docx2txt** - Word parsing
- **axios** - HTTP client (Node.js)

## ✅ Success Checklist

- [ ] Python service starts without errors
- [ ] http://localhost:8000 shows "healthy"
- [ ] Resume uploads successfully
- [ ] Backend logs show parser call
- [ ] Profile fields auto-fill
- [ ] Frontend shows updated data

---

**Ready to go!** 🚀 Upload a resume and watch the magic happen!

For issues, check:
1. Backend console logs
2. Python service logs
3. Browser network tab (Profile API calls)

**Need help?** See [RESUME_PARSER_SETUP.md](../RESUME_PARSER_SETUP.md) for detailed troubleshooting.
