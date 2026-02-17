# 🔍 Resume Parser Debugging Guide

## Status: DEBUGGING MODE ACTIVATED ✅

I've added **extensive logging** to identify exactly where the parser is failing.

---

## Quick Test Instructions

### 1. Start All Services

#### Terminal 1: Python Parser
```powershell
cd resume-parser-service
.\venv\Scripts\Activate.ps1
python main.py
```
**Expected:** `INFO: Uvicorn running on http://0.0.0.0:8000`

#### Terminal 2: Node.js Backend
```powershell
cd lakshyabackend
node index.js
```
**Expected:** Server starts on port 3000

#### Terminal 3: React Frontend
```powershell
cd lakshyafrontend
npm run dev
```
**Expected:** Dev server on port 5173

---

### 2. Upload a Resume

1. Login as Job Seeker
2. Go to Profile
3. Upload a PDF resume
4. **WATCH THE BACKEND CONSOLE**

---

## What the Logs Will Tell You

### ✅ **SUCCESS Pattern:**

```
========================================
🤖 RESUME PARSER - STARTING AUTO-FILL
========================================
📄 Public ID: resumes/resume_...
📄 File: resume.pdf | Size: 245678 bytes
👤 User ID: 65f...
🔐 Generated signed URL for parser (1h expiry)
🔗 Signed URL (first 100 chars): https://...

📡 ATTEMPT 1: Calling parser with signed URL...

=== CALLING RESUME PARSER SERVICE (signed URL) ===
📍 Parser URL: http://localhost:8000
📡 Endpoint: http://localhost:8000/parse-resume
📄 Resume URL (first 80 chars): https://...
⏱️  Timeout: 30000 ms
📤 Sending request...
✅ Parser response status: 200
📦 Parser response data: {
  "title": "Software Engineer",
  "skills": ["python", "javascript", "react"],
  ...
}
🔍 Has skills? true
🔍 Skills count: 15
🔍 Skills values: [ 'python', 'javascript', ... ]

=== PARSE AND AUTOFILL PROFILE ===
...

📊 PARSED DATA RECEIVED FROM PYTHON
📊 Title: Software Engineer
📊 Skills count: 15
📊 Skills array: ["python", "javascript", ...]

📋 CURRENT USER PROFILE STATE
📋 Current skills count: 0
📋 Current skills: []

🔄 PREPARING UPDATES
✓ Auto-filling title: Software Engineer
✓ Merged skills: 0 existing + 15 parsed = 15 total (15 new)

💾 UPDATING DATABASE
💾 Updates to apply: {
  "jobSeeker.title": "Software Engineer",
  "jobSeeker.skills": ["python", "javascript", ...]
}
✅ Database update successful!
✅ Updated skills count: 15

✅ ========================================
✅ PROFILE AUTO-FILL COMPLETE!
✅ Fields updated: 2
✅ Total skills now: 15
========================================

📤 RESPONSE SUMMARY:
Resume uploaded: ✅
Parser attempted: ✅
Parser success: ✅
Parser method: url
Skills in response: 15
```

---

### ❌ **FAILURE Scenarios:**

#### A) Python Service Not Running
```
❌ ================================================
❌ RESUME PARSER SERVICE ERROR (URL METHOD)
❌ ================================================
❌ Error code: ECONNREFUSED
⚠️  Resume parser service is not running on http://localhost:8000
```
**FIX:** Start Python service

---

#### B) Python Service Returns Error
```
✅ Parser response status: 500
📦 Parser response data: {
  "detail": "Failed to download resume: 403 Forbidden"
}
```
**FIX:** Cloudinary signed URL issue - check `CLOUDINARY_API_SECRET` in `.env`

---

#### C) Parser Returns Empty/No Skills
```
📊 PARSED DATA RECEIVED FROM PYTHON
📊 Skills count: 0
📊 Skills array: []

⊘ Skipping skills: no skills found in resume
```
**FIX:** Resume doesn't contain keywords from `SKILLS_DATABASE` in Python `main.py`

---

#### D) Skills Found But Not Saved
```
✓ Merged skills: 0 existing + 15 parsed = 15 total (15 new)

💾 UPDATING DATABASE
💾 Updates to apply: {
  "jobSeeker.skills": ["python", "javascript", ...]
}
❌ Failed to update user in database
```
**FIX:** Database connection issue or schema mismatch

---

#### E) All Fields Already Filled
```
ℹ️  ========================================
ℹ️   NO UPDATES NEEDED
ℹ️  ========================================
   All fields already have data or no data found in resume
```
**FIX:** Clear existing data OR check resume content

---

## Check Backend Response

After upload, check the **Network tab** in browser DevTools:

**Request:** `POST /api/profile/upload-resume`

**Response should include:**
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "data": {
    "jobSeeker": {
      "skills": ["python", "javascript", ...],  // Should have skills!
      "title": "Software Engineer",
      "bio": "...",
      ...
    }
  },
  "signedResumeUrl": "https://...",
  "parser": {
    "attempted": true,
    "method": "url",
    "success": true,
    "error": null,
    "skillsFound": 15
  }
}
```

**If `parser.success: false`**, check `parser.error` for the reason.

---

## Common Issues & Fixes

| Log Pattern | Issue | Fix |
|------------|-------|-----|
| `ECONNREFUSED` | Python not running | `cd resume-parser-service && python main.py` |
| `Parser response status: 500` | Python error | Check Python console logs |
| `Skills count: 0` | Resume missing keywords | Add skills to `SKILLS_DATABASE` in `main.py` |
| `NO UPDATES NEEDED` | Fields already filled | Clear profile data manually first |
| `Parser returned null` | Both URL and buffer failed | Check both backend + Python logs |
| No parser logs at all | Controller not calling parser | Check if `getSignedRawAuthenticatedUrl` throws error |

---

## Test with Sample Resume

Create a test PDF with this content:

```
John Doe
Software Engineer

Skills:
- Python
- JavaScript
- React
- Node.js
- MongoDB

Experience:
Senior Developer at TechCorp
2020 - 2024

Education:
BS Computer Science, MIT 2020
```

Save as PDF and upload.

**Expected:** At least 5 skills should be detected.

---

## Verify Database

After upload, check MongoDB:

```javascript
db.users.findOne({ email: "your-email@gmail.com" }, {
  "jobSeeker.skills": 1,
  "jobSeeker.title": 1,
  "jobSeeker.bio": 1
})
```

Should show populated skills array.

---

## Next Steps

1. ✅ Start all three services
2. ✅ Upload a resume
3. ✅ **COPY THE ENTIRE BACKEND LOG OUTPUT** and share it with me
4. ✅ Check the response `parser` object in Network tab
5. ✅ Check Python terminal for errors

The logs will tell us **exactly** where it's failing!
