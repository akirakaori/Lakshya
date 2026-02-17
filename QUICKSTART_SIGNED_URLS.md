# 🚀 Quick Start - Resume Parser with Cloudinary Signed URLs

## What Was Fixed

Your resume auto-fill wasn't working because:
1. ❌ Cloudinary authenticated assets blocked the Python parser (403 errors)
2. ❌ Recruiters couldn't view candidate resumes (401/403 errors)

Now it works with **signed URLs**! 🎉

---

## Start the System

### Terminal 1: Python Parser Service
```powershell
cd resume-parser-service
.\venv\Scripts\Activate.ps1
python main.py
```
**Expected:** `INFO: Uvicorn running on http://0.0.0.0:8000`

---

### Terminal 2: Node.js Backend
```powershell
cd lakshyabackend
npm start
```
**Expected:** `Server running on port 3000`

---

### Terminal 3: React Frontend
```powershell
cd lakshyafrontend
npm run dev
```
**Expected:** `Local: http://localhost:5173`

---

## Test the Auto-Fill

### 1. Upload a Resume
1. Login as **Job Seeker**
2. Go to **Profile** page
3. Click **"Upload Resume"**
4. Select a PDF resume with:
   - Job title (e.g., "Software Engineer")
   - Skills section (Python, JavaScript, React, etc.)
   - Education section
   - Experience section

### 2. Watch the Logs

**Backend console should show:**
```
=== UPLOAD RESUME CONTROLLER ===
File received: resume.pdf Size: 245678
Cloudinary upload result: https://res.cloudinary.com/...
🤖 Attempting to auto-fill profile from resume...
📄 Public ID: resumes/resume_...
🔐 Generated signed URL for parser (1h expiry)
Using signed URL method
=== CALLING RESUME PARSER SERVICE (signed URL) ===
✅ Parser response status: 200
✅ Profile auto-filled successfully!
```

**Python console should show:**
```
INFO: POST /parse-resume HTTP/1.1" 200 OK
INFO: Parsing resume from: https://res.cloudinary.com/...
INFO: Extracted 2543 characters from resume
INFO: Parsing complete: 12 skills found
```

### 3. Verify Results
- ✅ Skills appear in profile (automatically filled)
- ✅ Title appears (if found in resume)
- ✅ Experience/Education appear (if found)
- ✅ "View Resume" link works (opens in new tab)

---

## Test Resume Viewing (Recruiter)

### 1. Create a Job (as Recruiter)
1. Login as **Recruiter**
2. Create a new job posting

### 2. Apply (as Job Seeker)
1. Logout, login as **Job Seeker**
2. Apply to the job

### 3. View Candidate Resume (as Recruiter)
1. Logout, login as **Recruiter**
2. Go to **Applications** for your job
3. Click on the candidate
4. Click **"Download Resume"**
5. ✅ Resume should open in new tab (using signed URL)

---

## Troubleshooting

### Python service won't start
```powershell
# Check if port 8000 is already in use
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | 
  Select-Object OwningProcess -Unique | 
  ForEach-Object { taskkill /F /PID $_.OwningProcess }

# Then restart
cd resume-parser-service
.\venv\Scripts\Activate.ps1
python main.py
```

### Backend shows "Cloudinary Cloud Name: Missing"
This is just a warning when loading modules. It's harmless - Cloudinary config loads from `.env` when the server starts.

To fix:
1. Ensure `lakshyabackend/.env` exists
2. Should contain:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Parser returns 403
- Check that Python service is running on port 8000
- Check backend logs for "Generated signed URL for parser"
- If signed URL is missing, verify Cloudinary env vars are loaded

### Auto-fill doesn't work but upload succeeds
This is **expected behavior** - parsing is non-blocking. Check:

1. **Python service running?**
   ```powershell
   curl http://localhost:8000
   # Should return: {"status":"healthy","spacy_loaded":true}
   ```

2. **Backend logs show parser call?**
   - Look for "🤖 Attempting to auto-fill..."
   - If missing, check if Python service is reachable

3. **Parser logs show request?**
   - Look for "INFO: POST /parse-resume"
   - If missing, check Python service port

### Resume view shows 403/401
- Check that backend returns `signedResumeUrl` in response
- In browser dev tools, Network tab:
  - `GET /api/profile` → Response should have `signedResumeUrl` field
  - If missing, check `resumePublicId` exists in database

---

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ Upload resume.pdf
       ↓
┌─────────────────────────────────────────────────┐
│              Node.js Backend                    │
│                                                 │
│  1. Upload to Cloudinary (authenticated)       │
│     → Store: resumeUrl, resumePublicId         │
│                                                 │
│  2. Generate signed URL (1h expiry)            │
│     → Send to Python parser                    │
│     → OR send file buffer (fallback)           │
│                                                 │
│  3. Receive parsed JSON → Update MongoDB       │
│     → Merge skills, title, experience, etc.    │
│                                                 │
│  4. Generate signed URL (7d expiry)            │
│     → Return to frontend                       │
└──────┬──────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────┐
│   Python Parser Service     │
│   (Port 8000)               │
│                             │
│  - Download file via URL    │
│    (or receive buffer)      │
│  - Extract text (PDF/DOCX)  │
│  - Parse with spaCy NLP     │
│  - Return JSON              │
└─────────────────────────────┘
```

---

## Key Files

### Backend (Node.js)
- **`Utils/cloudinary-signed-url.js`** - Generates signed URLs
- **`Controller/user-controller.js`** - Upload + parsing logic
- **`Services/resume-parser-service.js`** - Calls Python service

### Python
- **`resume-parser-service/main.py`** - FastAPI parser service

### Frontend (React)
- **`hooks/use-profile.ts`** - React Query hooks (already correct)
- **`pages/job-seeker/profile.tsx`** - Uses signedResumeUrl
- **`pages/recruiter/candidate-profile.tsx`** - Uses signedResumeUrl

---

## What's Different Now?

| Before | After |
|--------|-------|
| ❌ Parser gets 403 (authenticated URL) | ✅ Parser uses signed URL (1h expiry) |
| ❌ "View Resume" gets 401 | ✅ "View Resume" uses signed URL (7d expiry) |
| ❌ Recruiter can't view candidate resume | ✅ Recruiter gets fresh signed URL |
| ❌ Auto-fill doesn't work | ✅ Auto-fill works with dual-method fallback |

---

## Next Steps

1. ✅ Test resume upload + auto-fill
2. ✅ Test resume viewing (job seeker profile)
3. ✅ Test resume viewing (recruiter → candidate)
4. ✅ Deploy to production (ensure env vars set)

---

**You're all set! The resume parser now works with Cloudinary authenticated delivery.** 🎉

---

## Support

If issues persist:
1. Check all three services are running (Python, Node, React)
2. Check browser console for errors
3. Check backend logs for "🤖 Attempting to auto-fill..."
4. Check Python logs for "INFO: POST /parse-resume"
5. Verify `.env` file has Cloudinary credentials
