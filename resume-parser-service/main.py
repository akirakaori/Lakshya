"""
Resume Parser Microservice using FastAPI + spaCy
Extracts structured data from resumes (PDF/DOCX) for auto-filling job seeker profiles.
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import requests
import tempfile
import os
import re
from typing import List, Optional
import logging

# NLP and document parsing libraries
import spacy
from spacy.matcher import PhraseMatcher
import pdfplumber
import docx2txt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Resume Parser Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
    logger.info("✓ spaCy model loaded successfully")
except OSError:
    logger.error("✗ spaCy model not found. Run: python -m spacy download en_core_web_sm")
    nlp = None

# Comprehensive skills dictionary for PhraseMatcher
SKILLS_DATABASE = [
    # Programming Languages
    "python", "javascript", "java", "c++", "c#", "ruby", "php", "swift", "kotlin",
    "go", "rust", "typescript", "scala", "r", "matlab", "sql", "html", "css",
    # Web Frameworks
    "react", "angular", "vue", "node.js", "express", "django", "flask", "fastapi",
    "spring boot", "asp.net", "laravel", "rails", "next.js", "nuxt.js",
    # Databases
    "mongodb", "mysql", "postgresql", "oracle", "sql server", "redis", "cassandra",
    "dynamodb", "firebase", "elasticsearch", "mariadb", "sqlite",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform", "ansible",
    "ci/cd", "git", "github", "gitlab", "bitbucket", "linux", "bash",
    # Mobile
    "android", "ios", "react native", "flutter", "xamarin", "ionic",
    # Data Science & AI
    "machine learning", "deep learning", "data science", "tensorflow", "pytorch",
    "scikit-learn", "pandas", "numpy", "jupyter", "tableau", "power bi", "nlp",
    # Other Technologies
    "rest api", "graphql", "microservices", "agile", "scrum", "jira", "api",
    "testing", "junit", "selenium", "jest", "mocha", "cypress",
    # Soft Skills
    "leadership", "communication", "teamwork", "problem solving", "project management",
    "time management", "analytical thinking", "creativity", "adaptability"
]

# Request/Response models
class ParseResumeRequest(BaseModel):
    resumeUrl: HttpUrl

class ParseResumeResponse(BaseModel):
    title: str = ""
    skills: List[str] = []
    education: str = ""
    experience: str = ""
    summary: str = ""
    experienceYears: int = 0
    # Debug fields
    educationFound: bool = False
    experienceFound: bool = False

@app.get("/")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Resume Parser",
        "spacy_loaded": nlp is not None
    }

@app.post("/parse-resume", response_model=ParseResumeResponse)
async def parse_resume(request: ParseResumeRequest):
    """
    Parse resume from Cloudinary URL and extract structured data
    
    Process:
    1. Download file from resumeUrl
    2. Extract text based on file type (PDF/DOCX)
    3. Use spaCy NLP + PhraseMatcher to extract skills
    4. Extract sections using heading markers
    5. Return structured JSON
    """
    if not nlp:
        raise HTTPException(
            status_code=500,
            detail="spaCy model not loaded. Run: python -m spacy download en_core_web_sm"
        )
    
    try:
        resume_url = str(request.resumeUrl)
        logger.info(f"Parsing resume from: {resume_url}")
        
        # Download resume file
        response = requests.get(resume_url, timeout=30)
        response.raise_for_status()
        
        # Detect file type from URL or content-type
        file_extension = _get_file_extension(resume_url, response.headers.get('content-type', ''))
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(response.content)
            temp_file_path = temp_file.name
        
        try:
            # Extract text based on file type
            text = _extract_text(temp_file_path, file_extension)
            logger.info(f"Extracted {len(text)} characters from resume")
            
            # Parse structured data
            parsed_data = _parse_resume_text(text)
            logger.info(f"Parsing complete: {len(parsed_data['skills'])} skills found")
            
            return ParseResumeResponse(**parsed_data)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except requests.RequestException as e:
        logger.error(f"Failed to download resume: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to download resume: {str(e)}")
    except Exception as e:
        logger.error(f"Resume parsing error: {e}")
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")

@app.post("/parse-resume-file", response_model=ParseResumeResponse)
async def parse_resume_file(file: UploadFile = File(...)):
    """
    Parse resume from direct file upload (multipart/form-data).
    This is the preferred endpoint — avoids Cloudinary URL access issues.
    """
    if not nlp:
        raise HTTPException(
            status_code=500,
            detail="spaCy model not loaded. Run: python -m spacy download en_core_web_sm"
        )

    try:
        logger.info(f"Parsing uploaded file: {file.filename}, content_type: {file.content_type}")

        # Detect file extension
        file_extension = _get_file_extension(
            file.filename or "",
            file.content_type or ""
        )

        # Read file content and write to temp file
        content = await file.read()
        logger.info(f"Received {len(content)} bytes")

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            text = _extract_text(temp_file_path, file_extension)
            logger.info(f"Extracted {len(text)} characters from resume")

            parsed_data = _parse_resume_text(text)
            logger.info(f"Parsing complete: {len(parsed_data['skills'])} skills found")

            return ParseResumeResponse(**parsed_data)
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        logger.error(f"Resume file parsing error: {e}")
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")


def _get_file_extension(url: str, content_type: str) -> str:
    """Determine file extension from URL or content-type"""
    url_lower = url.lower()
    
    if '.pdf' in url_lower or 'pdf' in content_type:
        return '.pdf'
    elif '.docx' in url_lower or 'wordprocessingml' in content_type:
        return '.docx'
    elif '.doc' in url_lower or 'msword' in content_type:
        return '.doc'
    else:
        # Default to PDF
        return '.pdf'

def _extract_text(file_path: str, extension: str) -> str:
    """Extract text from PDF or DOCX file"""
    text = ""
    
    try:
        if extension == '.pdf':
            # Extract text from PDF using pdfplumber
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        
        elif extension in ['.doc', '.docx']:
            # Extract text from Word document
            text = docx2txt.process(file_path)
        
        else:
            raise ValueError(f"Unsupported file type: {extension}")
        
        return text.strip()
        
    except Exception as e:
        logger.error(f"Text extraction failed: {e}")
        raise

def _parse_resume_text(text: str) -> dict:
    """Parse resume text and extract structured information"""
    
    logger.info("Starting resume text parsing...")
    logger.info(f"Text length: {len(text)} characters")
    
    # Process text with spaCy
    doc = nlp(text.lower())
    
    # Extract skills using PhraseMatcher
    skills = _extract_skills(doc)
    logger.info(f"Skills extracted: {len(skills)} - {skills[:10]}")
    
    # Extract sections by headings
    sections = _extract_sections(text)
    logger.info(f"Sections extracted - Education: {sections.get('educationFound', False)}, Experience: {sections.get('experienceFound', False)}")
    
    # Extract title/role from first section or near the top
    title = _extract_title(text)
    logger.info(f"Title extracted: '{title}'")
    
    # Extract years of experience
    experience_years = _extract_experience_years(text)
    logger.info(f"Experience years: {experience_years}")
    
    # Extract summary (first few sentences after header)
    summary = _extract_summary(text)
    logger.info(f"Summary extracted: {len(summary)} chars")
    
    result = {
        "title": title,
        "skills": skills,
        "education": sections.get("education", ""),
        "experience": sections.get("experience", ""),
        "summary": summary,
        "experienceYears": experience_years,
        # Debug fields
        "educationFound": sections.get("educationFound", False),
        "experienceFound": sections.get("experienceFound", False)
    }
    
    logger.info(f"Parse complete. Education length: {len(result['education'])}, Experience length: {len(result['experience'])}")
    
    return result

def _extract_skills(doc) -> List[str]:
    """Extract skills using spaCy PhraseMatcher"""
    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    
    # Add skill patterns
    patterns = [nlp.make_doc(skill) for skill in SKILLS_DATABASE]
    matcher.add("SKILLS", patterns)
    
    # Find matches
    matches = matcher(doc)
    
    # Extract unique skills (case-preserved from database)
    found_skills = set()
    for match_id, start, end in matches:
        skill_text = doc[start:end].text.lower()
        # Map back to original casing from SKILLS_DATABASE
        for skill in SKILLS_DATABASE:
            if skill.lower() == skill_text:
                found_skills.add(skill)
                break
    
    return sorted(list(found_skills))

def _extract_sections(text: str) -> dict:
    """Extract education, experience sections based on headings with improved detection"""
    sections = {
        "education": "",
        "experience": "",
        "educationFound": False,
        "experienceFound": False
    }
    
    # Comprehensive section headers (case-insensitive, word boundaries)
    education_headers = [
        r'\beducation\b',
        r'\bacademic\s+(?:background|qualifications?|history)\b',
        r'\bqualifications?\b',
        r'\bdegrees?\b',
        r'\buniversity\b',
        r'\bcertifications?\b',
        r'\beducational\s+background\b'
    ]
    
    experience_headers = [
        r'\b(?:work\s+)?experience\b',
        r'\bwork\s+history\b',
        r'\bemployment(?:\s+history)?\b',
        r'\bprofessional\s+(?:experience|background|history)\b',
        r'\bcareer\s+(?:history|summary)\b',
        r'\bpositions?\s+held\b'
    ]
    
    # Other section headers to detect boundaries
    other_headers = [
        r'\bskills?\b',
        r'\bprojects?\b',
        r'\bsummary\b',
        r'\bobjective\b',
        r'\bprofile\b',
        r'\bachievements?\b',
        r'\bawards?\b',
        r'\bcertifications?\b',
        r'\bhonors?\b',
        r'\bpublications?\b',
        r'\breferences?\b',
        r'\bcontact\b',
        r'\bpersonal\s+(?:information|details)\b'
    ]
    
    lines = text.split('\n')
    current_section = None
    section_content = []
    
    def matches_headers(line_text, header_patterns):
        """Check if line matches any header pattern"""
        line_lower = line_text.lower().strip()
        for pattern in header_patterns:
            if re.search(pattern, line_lower):
                # Additional check: header line should be relatively short
                if len(line_text.strip()) < 60:
                    return True
        return False
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        
        # Skip empty lines between sections
        if not line_stripped:
            continue
        
        # Check for education section header
        if matches_headers(line_stripped, education_headers):
            if current_section and section_content:
                sections[current_section] = '\n'.join(section_content).strip()
            current_section = "education"
            sections["educationFound"] = True
            section_content = []
            continue
        
        # Check for experience section header
        elif matches_headers(line_stripped, experience_headers):
            if current_section and section_content:
                sections[current_section] = '\n'.join(section_content).strip()
            current_section = "experience"
            sections["experienceFound"] = True
            section_content = []
            continue
        
        # Check for other section headers (marks end of current section)
        elif matches_headers(line_stripped, other_headers):
            if current_section and section_content:
                sections[current_section] = '\n'.join(section_content).strip()
            current_section = None
            section_content = []
            continue
        
        # Add content to current section
        elif current_section and line_stripped:
            section_content.append(line_stripped)
    
    # Save last section
    if current_section and section_content:
        sections[current_section] = '\n'.join(section_content).strip()
    
    # Fallback: Detect education by degree keywords if section not found
    if not sections["educationFound"]:
        degree_patterns = [
            r'\b(?:bachelor|master|phd|doctorate|diploma|associate|mba|m\.?s\.?c?|b\.?s\.?c?|b\.?tech|m\.?tech)\b',
            r'\buniversity\b',
            r'\bcollege\b',
            r'\bdegree\b'
        ]
        edu_lines = []
        for line in lines:
            if any(re.search(p, line.lower()) for p in degree_patterns):
                edu_lines.append(line.strip())
                if len('\n'.join(edu_lines)) > 300:
                    break
        if edu_lines:
            sections["education"] = '\n'.join(edu_lines)
            sections["educationFound"] = True
    
    # Fallback: Detect experience by date patterns if section not found
    if not sections["experienceFound"]:
        date_patterns = [
            r'\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current)\b',
            r'\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}\b'
        ]
        exp_lines = []
        for line in lines:
            if any(re.search(p, line.lower()) for p in date_patterns):
                exp_lines.append(line.strip())
                if len('\n'.join(exp_lines)) > 400:
                    break
        if exp_lines:
            sections["experience"] = '\n'.join(exp_lines)
            sections["experienceFound"] = True
    
    # Limit section length to avoid too much data (increased limit)
    if len(sections["education"]) > 800:
        sections["education"] = sections["education"][:800] + "..."
    if len(sections["experience"]) > 1000:
        sections["experience"] = sections["experience"][:1000] + "..."
    
    # Debug logging
    logger.info(f"Education found: {sections['educationFound']}, length: {len(sections['education'])}")
    logger.info(f"Experience found: {sections['experienceFound']}, length: {len(sections['experience'])}")
    
    return sections

def _extract_title(text: str) -> str:
    """Extract job title/role from resume (usually near the top)"""
    lines = text.split('\n')
    
    # Common title indicators
    title_patterns = [
        r'(?i)^(software engineer|developer|data scientist|analyst|manager|consultant|designer)',
        r'(?i)(senior|junior|lead|principal)\s+(engineer|developer|analyst)',
    ]
    
    # Check first 10 lines
    for line in lines[:10]:
        line_stripped = line.strip()
        if not line_stripped or len(line_stripped) > 50:
            continue
        
        for pattern in title_patterns:
            if re.search(pattern, line_stripped):
                return line_stripped
    
    return ""

def _extract_experience_years(text: str) -> int:
    """Extract total years of experience from resume"""
    # Look for patterns like "5+ years", "3 years of experience"
    patterns = [
        r'(\d+)\+?\s*years?\s+(?:of\s+)?experience',
        r'experience[:\s]+(\d+)\+?\s*years?',
    ]
    
    years_found = []
    for pattern in patterns:
        matches = re.findall(pattern, text.lower())
        years_found.extend([int(m) for m in matches])
    
    return max(years_found) if years_found else 0

def _extract_summary(text: str) -> str:
    """Extract professional summary/objective"""
    lines = text.split('\n')
    
    # Look for summary section
    summary_headers = r'(?i)\b(summary|objective|profile|about)\b'
    
    in_summary = False
    summary_lines = []
    
    for line in lines:
        line_stripped = line.strip()
        
        if re.search(summary_headers, line_stripped):
            in_summary = True
            continue
        
        if in_summary:
            if line_stripped:
                summary_lines.append(line_stripped)
                if len(' '.join(summary_lines)) > 200:
                    break
            else:
                # Empty line might indicate section end
                if summary_lines:
                    break
    
    summary = ' '.join(summary_lines)
    
    # If no summary section found, use first few sentences
    if not summary:
        first_paragraph = ' '.join(lines[:5])
        summary = first_paragraph[:200]
    
    return summary.strip()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
