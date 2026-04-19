/**
 * Job Match Service
 * -----------------
 * Deterministic skill matching + semantic similarity + optional Grok suggestions.
 *
 * Score formula:
 * matchScore = round((0.6 * skillScore + 0.4 * semanticScore) * 100)
 *
 * Grok never affects the score — it only enriches suggestions / summaryRewrite.
 */

const axios = require('axios');
const JobMatchAnalysis = require('../models/job-match-analysis');
const UserModel = require('../models/user-model');
const JobModel = require('../models/job-model');

// --------------- Config -----------------

const PYTHON_SERVICE_URL = process.env.PYTHON_PARSER_URL || 'http://localhost:8000';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_TIMEOUT = parseInt(process.env.GROQ_TIMEOUT || '30000', 10);

const SEMANTIC_TIMEOUT = 7000;
const CACHE_DAYS = 7;

// --------------- Helpers -----------------

/**
 * Normalize a skill string for comparison:
 * lowercase, trim, strip punctuation except useful chars.
 */
function normalizeSkill(skill) {
  return String(skill || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s.+#]/g, '') // keep dots, plus, hash (c++, c#, node.js)
    .replace(/\s+/g, ' ');
}

/**
 * Build a flat text blob from user's job-seeker profile for semantic comparison.
 */
function buildResumeText(user) {
  const js = user?.jobSeeker || {};
  const parts = [];

  if (js.bio) parts.push(js.bio);
  if (js.summary) parts.push(js.summary);
  if (Array.isArray(js.skills) && js.skills.length) parts.push(js.skills.join(', '));
  if (js.experience) parts.push(String(js.experience).slice(0, 500));
  if (js.education) parts.push(String(js.education).slice(0, 300));
  if (js.title) parts.push(js.title);

  return parts.join(' ').trim();
}

/**
 * Build a flat text blob from the job listing for semantic comparison.
 */
function buildJobText(job) {
  const parts = [];

  if (job?.description) parts.push(job.description);
  if (Array.isArray(job?.requirements) && job.requirements.length) {
    parts.push(job.requirements.join('. '));
  }
  if (Array.isArray(job?.skillsRequired) && job.skillsRequired.length) {
    parts.push(job.skillsRequired.join(', '));
  }
  if (job?.title) parts.push(job.title);

  return parts.join(' ').trim();
}

// --------------- Skill Matching (deterministic) -----------------

function computeSkillMatch(userSkills, requiredSkills) {
  const safeUserSkills = Array.isArray(userSkills) ? userSkills : [];
  const safeRequiredSkills = Array.isArray(requiredSkills) ? requiredSkills : [];

  const normUser = safeUserSkills.map(normalizeSkill);
  const normRequired = safeRequiredSkills.map(normalizeSkill);
  const userSet = new Set(normUser);

  const matched = [];
  const missing = [];

  for (let i = 0; i < normRequired.length; i++) {
    if (userSet.has(normRequired[i])) {
      matched.push(safeRequiredSkills[i]); // preserve original casing
    } else {
      missing.push(safeRequiredSkills[i]);
    }
  }

  const score =
    normRequired.length > 0 ? matched.length / normRequired.length : 0;

  return {
    matchedSkills: matched,
    missingSkills: missing,
    skillScore: score,
  };
}

// --------------- Semantic Score (Python service) -----------------

async function getSemanticScore(resumeText, jobText) {
  try {
    const { data } = await axios.post(
      `${PYTHON_SERVICE_URL}/semantic-score`,
      { resumeText, jobText },
      { timeout: SEMANTIC_TIMEOUT }
    );

    return {
      semanticScore: typeof data?.semanticScore === 'number' ? data.semanticScore : 0,
      semanticPercent:
        typeof data?.semanticPercent === 'number' ? data.semanticPercent : 0,
    };
  } catch (err) {
    console.warn('⚠ Semantic score unavailable, defaulting to 0:', err.message);
    return { semanticScore: 0, semanticPercent: 0 };
  }
}

// --------------- Rule-Based Suggestions -----------------

function ruleBasedSuggestions(missingSkills, matchScore, jobTitle) {
  const tips = [];
  const safeMissingSkills = Array.isArray(missingSkills) ? missingSkills : [];

  if (safeMissingSkills.length > 0) {
    const top = safeMissingSkills.slice(0, 3).join(', ');
    tips.push(`Add these in-demand skills to your profile: ${top}.`);
  }

  if (safeMissingSkills.length > 3) {
    tips.push(
      `Consider taking online courses in ${safeMissingSkills.slice(3, 6).join(', ')} to strengthen your application.`
    );
  }

  if (matchScore < 50) {
    tips.push(
      `Your match score is below 50%. Tailor your resume summary to highlight relevant experience for "${jobTitle}".`
    );
  } else if (matchScore < 75) {
    tips.push(
      `You're a moderate match — emphasize projects or certifications related to "${jobTitle}" in your profile.`
    );
  }

  tips.push(
    'Write a targeted cover letter explaining how your experience directly maps to the job requirements.'
  );

  if (tips.length < 3) {
    tips.push(
      'Keep your profile up to date with your latest projects and accomplishments.'
    );
  }

  return tips.slice(0, 5);
}

// --------------- Grok Suggestions -----------------

function extractTextContent(content) {
  if (typeof content === 'string') return content.trim();

  // Some APIs may return content as structured arrays
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.type === 'output_text' && typeof item?.text === 'string') return item.text;
        if (typeof item?.text === 'string') return item.text;
        return '';
      })
      .join('')
      .trim();
  }

  return '';
}

async function getGroqSuggestions(
  missingSkills,
  matchScore,
  jobTitle,
  jobDescription,
  requiredSkills,
  matchedSkills,
  resumeSummary
) {
  if (!GROQ_API_KEY) {
    console.warn('⚠ GROQ_API_KEY is missing. Using rule-based suggestions.');
    return null;
  }

  try {
    const { data } = await axios.post(
      `${GROQ_BASE_URL}/chat/completions`,
      {
        model: GROQ_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are a career advisor AI. Return only valid JSON. No markdown. No explanation outside JSON.'
          },
          {
            role: 'user',
            content: `
Analyze this job-resume match.

Return JSON with this exact structure:
{
  "summaryRewrite": "string",
  "improvementSuggestions": ["string"],
  "skillAdvice": ["string"]
}

Job Details:
- Title: "${jobTitle || ''}"
- Description: "${String(jobDescription || '').slice(0, 400)}"
- Required skills: ${(Array.isArray(requiredSkills) && requiredSkills.length)
    ? requiredSkills.join(', ')
    : 'not specified'}

Candidate Profile:
- Matched skills: ${(Array.isArray(matchedSkills) && matchedSkills.length)
    ? matchedSkills.join(', ')
    : 'none'}
- Missing skills: ${(Array.isArray(missingSkills) && missingSkills.length)
    ? missingSkills.join(', ')
    : 'none'}
- Match score: ${matchScore}%
- Resume summary: "${String(resumeSummary || '').slice(0, 300)}"

Rules:
- summaryRewrite: 1-2 sentences rewriting the candidate summary for this specific job
- improvementSuggestions: 3-5 concise, actionable tips
- skillAdvice: 1-3 concise tips specifically for the missing skills
- Return ONLY valid JSON
            `.trim()
          }
        ]
      },
      {
        timeout: GROQ_TIMEOUT,
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const raw = data?.choices?.[0]?.message?.content?.trim() || '';

    if (!raw) {
      throw new Error('Empty response content from Groq');
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON object found in Groq response');
      parsed = JSON.parse(match[0]);
    }

    const suggestions = [
      ...(Array.isArray(parsed?.improvementSuggestions) ? parsed.improvementSuggestions : []),
      ...(Array.isArray(parsed?.skillAdvice) ? parsed.skillAdvice : [])
    ].filter((s) => typeof s === 'string').slice(0, 5);

    const summaryRewrite =
      typeof parsed?.summaryRewrite === 'string' ? parsed.summaryRewrite : '';

    if (suggestions.length === 0) {
      throw new Error('Groq returned empty suggestions');
    }

    return {
      suggestions,
      summaryRewrite,
      source: 'groq'
    };
  } catch (err) {
    console.warn('⚠ Groq suggestions failed:', err?.response?.data || err.message);
    return null;
  }
}

// --------------- Main: computeJobMatch -----------------

/**
 * Compute full match analysis for a given user & job.
 * Returns the analysis object (not yet saved).
 */
async function computeJobMatch(user, job) {
  try {
    // 1. Skill matching (deterministic)
    const { matchedSkills, missingSkills, skillScore } = computeSkillMatch(
      user?.jobSeeker?.skills,
      job?.skillsRequired
    );

    // 2. Semantic similarity
    const resumeText = buildResumeText(user);
    const jobText = buildJobText(job);
    const { semanticScore, semanticPercent } = await getSemanticScore(
      resumeText,
      jobText
    );

    // 3. Hybrid score
    const finalRaw = 0.6 * skillScore + 0.4 * semanticScore;
    const matchScore = Math.round(finalRaw * 100);
    const skillScorePercent = Math.round(skillScore * 100);

    // 4. Suggestions — try Grok, fallback to rule-based
    let suggestions = [];
    let summaryRewrite = '';
    let suggestionSource = 'rule';

const groqResult = await getGroqSuggestions(
  missingSkills,
  matchScore,
  job?.title || '',
  job?.description || '',
  job?.skillsRequired || [],
  matchedSkills,
  user?.jobSeeker?.bio || user?.jobSeeker?.summary || ''
);

if (groqResult) {
  suggestions = groqResult.suggestions;
  summaryRewrite = groqResult.summaryRewrite;
  suggestionSource = 'groq';
  console.log(`✅ Groq suggestions generated for job="${job?.title || ''}"`);
} else {
  suggestions = ruleBasedSuggestions(missingSkills, matchScore, job?.title || '');
  summaryRewrite = '';
  suggestionSource = 'rule';
  console.log(`ℹ Using rule-based suggestions for job="${job?.title || ''}" (Groq unavailable)`);
}
    return {
      matchScore: typeof matchScore === 'number' ? matchScore : 0,
      skillScore: typeof skillScore === 'number' ? skillScore : 0,
      semanticScore: typeof semanticScore === 'number' ? semanticScore : 0,
      skillScorePercent:
        typeof skillScorePercent === 'number' ? skillScorePercent : 0,
      semanticPercent:
        typeof semanticPercent === 'number' ? semanticPercent : 0,
      matchedSkills: Array.isArray(matchedSkills) ? matchedSkills : [],
      missingSkills: Array.isArray(missingSkills) ? missingSkills : [],
      suggestions: Array.isArray(suggestions) ? suggestions : [],
      summaryRewrite: typeof summaryRewrite === 'string' ? summaryRewrite : '',
      suggestionSource,
      analyzedAt: new Date(),
      version: 'v2',
      profileUpdatedAtUsed: user?.jobSeeker?.profileUpdatedAt || null,
      resumeParsedAtUsed: user?.jobSeeker?.resumeParsedAt || null,
    };
  } catch (error) {
    console.error('❌ Error in computeJobMatch:', error);

    return {
      matchScore: 0,
      skillScore: 0,
      semanticScore: 0,
      skillScorePercent: 0,
      semanticPercent: 0,
      matchedSkills: [],
      missingSkills: [],
      suggestions: ['Unable to generate suggestions at this time. Please try again later.'],
      summaryRewrite: '',
      suggestionSource: 'rule',
      analyzedAt: new Date(),
      version: 'v2',
      profileUpdatedAtUsed: user?.jobSeeker?.profileUpdatedAt || null,
      resumeParsedAtUsed: user?.jobSeeker?.resumeParsedAt || null,
    };
  }
}

// --------------- Cached analysis with upsert -----------------

/**
 * Get (or compute + cache) match analysis for a userId + jobId pair.
 * - If cached result exists, analyzedAt <= CACHE_DAYS old, and user
 *   resumeParsedAt has not changed -> return cache.
 * - Otherwise re-compute, upsert, and return.
 */
async function getOrComputeMatch(userId, jobId) {
  const [user, job] = await Promise.all([
    UserModel.findById(userId),
    JobModel.findById(jobId),
  ]);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  // Check cache
  const cached = await JobMatchAnalysis.findOne({ userId, jobId });

  if (cached) {
    const ageMs = Date.now() - new Date(cached.analyzedAt).getTime();
    const cacheFresh = ageMs < CACHE_DAYS * 24 * 60 * 60 * 1000;

    const resumeUnchanged =
      !user?.jobSeeker?.resumeParsedAt ||
      new Date(user.jobSeeker.resumeParsedAt) <= new Date(cached.analyzedAt);

    if (cacheFresh && resumeUnchanged) {
      console.log(`✅ Returning cached match analysis for user=${userId} job=${jobId}`);
      return cached;
    }
  }

  // Compute fresh analysis
  console.log(`🔄 Computing fresh match analysis for user=${userId} job=${jobId}`);
  const analysis = await computeJobMatch(user, job);

  // Upsert
  const saved = await JobMatchAnalysis.findOneAndUpdate(
    { userId, jobId },
    { ...analysis, userId, jobId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return saved;
}

/**
 * Get cached match scores for multiple jobs (batch).
 * Returns a map: { [jobId]: { matchScore, analyzedAt, source } }
 * Does NOT compute missing scores — only returns cached values.
 */
async function getBatchMatchScores(userId, jobIds) {
  const safeJobIds = Array.isArray(jobIds) ? jobIds : [];

  const cached = await JobMatchAnalysis.find({
    userId,
    jobId: { $in: safeJobIds },
  })
    .select('jobId matchScore analyzedAt')
    .lean();

  const result = {};

  safeJobIds.forEach((jobId) => {
    result[jobId] = {
      matchScore: null,
      analyzedAt: null,
      source: 'missing',
    };
  });

  cached.forEach((entry) => {
    const jobIdStr = entry.jobId.toString();
    result[jobIdStr] = {
      matchScore: entry.matchScore,
      analyzedAt: entry.analyzedAt,
      source: 'cache',
    };
  });

  return result;
}

// --------------- GET cached match with isOutdated flag -----------------

/**
 * Get cached match analysis and check if it's outdated.
 * Does NOT compute — only reads cache.
 * Returns { analysis, isOutdated } or { analysis: null, isOutdated: false } if no cache.
 */
async function getCachedMatchWithOutdatedFlag(userId, jobId) {
  const [user, cached] = await Promise.all([
    UserModel.findById(userId),
    JobMatchAnalysis.findOne({ userId, jobId }),
  ]);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!cached) {
    return { analysis: null, isOutdated: false };
  }

  const userProfileUpdatedAt = user?.jobSeeker?.profileUpdatedAt || null;
  const userResumeParsedAt = user?.jobSeeker?.resumeParsedAt || null;
  const analysisProfileUpdatedAt = cached?.profileUpdatedAtUsed || null;
  const analysisResumeParsedAt = cached?.resumeParsedAtUsed || null;

  let isOutdated = false;

  if (userProfileUpdatedAt && analysisProfileUpdatedAt) {
    if (new Date(userProfileUpdatedAt) > new Date(analysisProfileUpdatedAt)) {
      isOutdated = true;
    }
  } else if (userProfileUpdatedAt && !analysisProfileUpdatedAt) {
    isOutdated = true;
  }

  if (userResumeParsedAt && analysisResumeParsedAt) {
    if (new Date(userResumeParsedAt) > new Date(analysisResumeParsedAt)) {
      isOutdated = true;
    }
  } else if (userResumeParsedAt && !analysisResumeParsedAt) {
    isOutdated = true;
  }

  return { analysis: cached, isOutdated };
}

// --------------- POST analyze (compute + upsert) -----------------

/**
 * Compute fresh match analysis and upsert into JobMatchAnalysis.
 * Called when user explicitly clicks "Analyze My Match" or "Analyze Again".
 */
async function computeAndUpsertMatch(userId, jobId) {
  const [user, job] = await Promise.all([
    UserModel.findById(userId),
    JobModel.findById(jobId),
  ]);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  console.log(`🔄 Computing fresh match analysis for user=${userId} job=${jobId}`);
  const analysis = await computeJobMatch(user, job);

  const saved = await JobMatchAnalysis.findOneAndUpdate(
    { userId, jobId },
    { ...analysis, userId, jobId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return saved;
}

module.exports = {
  computeJobMatch,
  getOrComputeMatch,
  getBatchMatchScores,
  getCachedMatchWithOutdatedFlag,
  computeAndUpsertMatch,
  computeSkillMatch,
  normalizeSkill,
  ruleBasedSuggestions,
};