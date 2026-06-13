# Lakshya

Lakshya is a full-stack job portal built to connect **job seekers, recruiters, and admins** in one workflow. It combines job discovery, application tracking, recruiter hiring tools, and an AI-assisted resume parsing pipeline that can autofill profile data after upload.

## Why this project stands out

- **Role-based experience** for job seekers, recruiters, and admins
- **AI-powered resume parsing** with background processing and profile autofill
- **Job matching and recommendations** to help candidates find relevant roles faster
- **Recruiter hiring workflow** with application filtering, bulk status updates, and candidate profiles
- **Real-time notifications** with Socket.IO
- **Modern production stack** using React, Node.js, MongoDB, Cloudinary, and a Python NLP service

## Core features

### For job seekers

- Browse and search jobs with filters
- View job details and save jobs
- Apply and track application status
- See dashboard stats for applications, interviews, saved jobs, and hiring progress
- Upload a resume and automatically extract profile data
- Get job match analysis with skills, missing skills, and suggestions

### For recruiters

- Post, edit, and manage jobs
- View and filter applications by status, match score, and experience
- Shortlist, reject, or move candidates through the hiring pipeline
- Review candidate profiles and match snapshots
- Perform bulk status updates
- Monitor recent hiring activity

### For admins

- Access dedicated admin dashboard and profile pages
- Manage platform-level oversight

## AI and automation

Lakshya uses a separate **resume parser microservice** built with **FastAPI + spaCy**. When a candidate uploads a resume:

1. The backend uploads the file to Cloudinary
2. A background job sends the resume to the parser service
3. Parsed skills, title, education, experience, and summary are merged into the profile
4. Match analysis and recommendation data are updated for better job discovery

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, React Query, Tailwind CSS, Socket.IO client |
| Backend | Node.js, Express, MongoDB, Mongoose, Socket.IO, BullMQ |
| AI service | Python, FastAPI, spaCy, pdfplumber, docx2txt |
| Storage & media | MongoDB, Cloudinary |
| UI/UX | Framer Motion, React Toastify, Recharts |

## Project structure

```text
Lakshya/
├── lakshyafrontend/        # React frontend
├── lakshyabackend/         # Express API
└── resume-parser-service/   # Python resume parsing microservice
```

## Getting started

### Prerequisites

- Node.js 20+
- MongoDB
- Python 3.8+ for the resume parser

### 1) Backend

```bash
cd lakshyabackend
npm install
```

Create `lakshyabackend/.env`:

```env
MONGO_URI=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GROQ_API_KEY=
RESUME_PARSER_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

Run the API:

```bash
npm run dev
```

### 2) Frontend

```bash
cd lakshyafrontend
npm install
npm run dev
```

### 3) Resume parser service

```bash
cd resume-parser-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python main.py
```

## Default local URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Resume parser | http://localhost:8000 |

## Useful API areas

- `/api/auth` - register, login, forgot password, reset password
- `/api/jobs` - browse, create, update, save, and manage jobs
- `/api/profile` - profile updates, resume upload, avatar upload, password change
- `/api/job-seeker` - job matching and recommendations
- `/api/recruiter` - application management and hiring activity
- `/api/notifications` - notification feed and read state

## Recruiter impact

This project is strong for recruiters because it shows more than CRUD screens: it demonstrates **role-based access control, hiring workflow design, resume intelligence, live updates, and data-driven candidate evaluation**. It feels like a real product rather than a demo.

## Related notes

- `SETUP.md` contains a shorter setup guide
- The `lakshyabackend` and `lakshyafrontend` folders also contain local READMEs

