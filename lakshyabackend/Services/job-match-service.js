/**
 * Job Match Service
 * -----------------
 * Deterministic skill matching + semantic similarity + optional Ollama suggestions.
 *
 * Score formula: matchScore = round( (0.6 * skillScore + 0.4 * semanticScore) * 100 )
 * Ollama never affects the score — only enriches suggestions / summaryRewrite.
 */
const axios = require('axios');
const JobMatchAnalysis = require('../models/job-match-analysis');
const UserModel = require('../models/user-model');
const JobModel = require('../models/job-model');

// --------------- Config -----------------
const PYTHON_SERVICE_URL = process.env.PYTHON_PARSER_URL || 'http://localhost:8000';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';
const OLLAMA_TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT || '30000'); // default 30s (configurable)
const SEMANTIC_TIMEOUT = 7000; // 7 seconds
const CACHE_DAYS = 7;

// Startup diagnostic — log Ollama config so it's visible in server logs
console.log(`[job-match] Ollama config → URL=${OLLAMA_URL}  MODEL=${OLLAMA_MODEL}  TIMEOUT=${OLLAMA_TIMEOUT}ms`);

// --------------- Helpers -----------------

/**
 * Normalize a skill string for comparison: lowercase, trim, strip punctuation.
 */
function normalizeSkill(skill) {
  return skill
    .toLowerCase()
    .trim()
    .replace(/[^\w\s.+#]/g, '') // keep dots, plus, hash (c++, c#, node.js)
    .replace(/\s+/g, ' ');
}

/**
 * Build a flat text blob from user's job-seeker profile for semantic comparison.
 */
function buildResumeText(user) {
  const js = user.jobSeeker || {};
  const parts = [];
  if (js.bio) parts.push(js.bio);
  if (js.summary) parts.push(js.summary);
  if (js.skills && js.skills.length) parts.push(js.skills.join(', '));
  if (js.experience) parts.push(js.experience.slice(0, 500));
  if (js.education) parts.push(js.education.slice(0, 300));
  if (js.title) parts.push(js.title);
  return parts.join(' ').trim();
}

/**
 * Build a flat text blob from the job listing for semantic comparison.
 */
function buildJobText(job) {
  const parts = [];
  if (job.description) parts.push(job.description);
  if (job.requirements && job.requirements.length) {
    parts.push(job.requirements.join('. '));
  }
  if (job.skillsRequired && job.skillsRequired.length) {
    parts.push(job.skillsRequired.join(', '));
  }
  if (job.title) parts.push(job.title);
  return parts.join(' ').trim();
}

// --------------- Skill Matching (deterministic) -----------------

function computeSkillMatch(userSkills, requiredSkills) {
  const normUser = (userSkills || []).map(normalizeSkill);
  const normRequired = (requiredSkills || []).map(normalizeSkill);
  const userSet = new Set(normUser);

  const matched = [];
  const missing = [];

  for (let i = 0; i < normRequired.length; i++) {
    if (userSet.has(normRequired[i])) {
      matched.push(requiredSkills[i]); // preserve original casing
    } else {
      missing.push(requiredSkills[i]);
    }
  }

  const score = normRequired.length > 0 ? matched.length / normRequired.length : 0;

  return { matchedSkills: matched, missingSkills: missing, skillScore: score };
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
      semanticScore: data.semanticScore ?? 0,
      semanticPercent: data.semanticPercent ?? 0,
    };
  } catch (err) {
    console.warn('⚠ Semantic score unavailable, defaulting to 0:', err.message);
    return { semanticScore: 0, semanticPercent: 0 };
  }
}

// --------------- Rule-Based Suggestions -----------------

function ruleBasedSuggestions(missingSkills, matchScore, jobTitle) {
  const tips = [];

  if (missingSkills.length > 0) {
    const top = missingSkills.slice(0, 3).join(', ');
    tips.push(`Add these in-demand skills to your profile: ${top}.`);
  }

  if (missingSkills.length > 3) {
    tips.push(
      `Consider taking online courses in ${missingSkills.slice(3, 6).join(', ')} to strengthen your application.`
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

// --------------- Ollama Health Check -----------------

/**
 * Check if the Ollama server is reachable AND the configured model is available.
 * Logs a clear warning if the server is up but the model is missing.
 * @returns {Promise<boolean>} true only if Ollama is running and the model exists
 */
async function checkOllamaHealth() {
  try {
    const { data } = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
    // data.models is an array of { name, ... }
    const models = Array.isArray(data.models) ? data.models : [];
    const modelNames = models.map((m) => (m.name || '').toLowerCase());
    const modelLower = OLLAMA_MODEL.toLowerCase();
    // match exact name or name without tag (e.g. "llama3.2:1b" matches "llama3.2:1b")
    const modelFound = modelNames.some(
      (n) => n === modelLower || n.startsWith(modelLower.split(':')[0] + ':')
    );
    if (!modelFound) {
      console.warn(
        `⚠ Ollama is running but model "${OLLAMA_MODEL}" is not installed.\n` +
        `  Available models: ${modelNames.join(', ') || '(none)'}\n` +
        `  → Fix: run  ollama pull ${OLLAMA_MODEL}`
      );
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// --------------- Ollama Suggestions (optional, with timeout + fallback) -----------------

/**
 * Map an Axios/network error to a human-readable reason for logging.
 */
function describeOllamaError(err) {
  const code = err.code;
  const status = err.response?.status;
  if (code === 'ECONNREFUSED') return 'Ollama server is not running (ECONNREFUSED)';
  if (code === 'ETIMEDOUT' || code === 'ECONNABORTED') return `Request timed out after ${OLLAMA_TIMEOUT}ms — model may be too slow for CPU inference`;
  if (status === 404) return `Model "${OLLAMA_MODEL}" not found — run: ollama pull ${OLLAMA_MODEL}`;
  if (err.message && err.message.toLowerCase().includes('json')) return `Ollama returned malformed/invalid JSON: ${err.message}`;
  return err.message || 'Unknown error';
}

async function getOllamaSuggestions(missingSkills, matchScore, jobTitle, jobDescription, requiredSkills, matchedSkills, resumeSummary) {
  // --- fast health check before spending up to OLLAMA_TIMEOUT waiting ---
  const healthy = await checkOllamaHealth();
  if (!healthy) {
    console.warn(`⚠ Ollama health check failed — server unreachable at ${OLLAMA_URL}. Is Ollama installed and running? (run: ollama serve)`);
    return null;
  }

  try {
    const prompt = `You are a career advisor AI. Analyze this job-resume match and return ONLY a valid JSON object — no markdown, no extra text.

Required JSON structure:
{"summaryRewrite":"...","improvementSuggestions":["...","..."],"skillAdvice":["..."]}

Job Details:
- Title: "${jobTitle}"
- Description: "${(jobDescription || '').slice(0, 400)}"
- Required skills: ${(requiredSkills || []).join(', ') || 'not specified'}

Candidate Profile:
- Matched skills: ${matchedSkills.join(', ') || 'none'}
- Missing skills: ${missingSkills.join(', ') || 'none'}
- Match score: ${matchScore}%
- Resume summary: "${(resumeSummary || '').slice(0, 300)}"

Instructions:
- summaryRewrite: 1-2 sentences rewriting the candidate summary to target this specific job
- improvementSuggestions: 3-5 concise, actionable tips the candidate can act on
- skillAdvice: 1-3 tips specifically about the missing skills (courses, projects, certifications)
- Return ONLY the JSON object, no other text`;

    const { data } = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt,
        format: 'json',          // instruct Ollama to constrain output to JSON
        stream: false,
        options: { temperature: 0.2 }, // low temperature = more deterministic / less hallucination
      },
      { timeout: OLLAMA_TIMEOUT }
    );

    const raw = (data.response || '').trim();
    console.log(`[ollama] raw response (first 300 chars): ${raw.slice(0, 300)}`);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (firstErr) {
      console.warn(`[ollama] direct JSON.parse failed (${firstErr.message}) — attempting fence-strip + extraction`);
      // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
      const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      // 2. Extract the first complete {...} block
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn(`[ollama] no JSON object found in response. Full output:\n${raw}`);
        throw new Error(`No JSON object in Ollama response: ${raw.slice(0, 200)}`);
      }
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.warn(`[ollama] JSON extraction also failed. Extracted block:\n${jsonMatch[0]}`);
        throw new Error(`Invalid JSON after extraction: ${parseErr.message}`);
      }
    }

    const suggestions = [
      ...(Array.isArray(parsed.improvementSuggestions) ? parsed.improvementSuggestions : []),
      ...(Array.isArray(parsed.skillAdvice) ? parsed.skillAdvice : []),
    ].filter((s) => typeof s === 'string').slice(0, 5);

    const summaryRewrite = typeof parsed.summaryRewrite === 'string' ? parsed.summaryRewrite : '';

    if (suggestions.length === 0) throw new Error('Ollama returned empty suggestions array');

    return { suggestions, summaryRewrite, source: 'ollama' };
  } catch (err) {
    const reason = describeOllamaError(err);
    console.warn(`⚠ Ollama suggestions failed — ${reason}`);
    if (err.response?.status === 404) {
      console.warn(`  → Fix: run  ollama pull ${OLLAMA_MODEL}`);
    } else if (err.code === 'ECONNREFUSED') {
      console.warn(`  → Fix: start Ollama with  ollama serve  (or install from https://ollama.com)`);
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') {
      console.warn(`  → Fix: increase OLLAMA_TIMEOUT env var (current: ${OLLAMA_TIMEOUT}ms), or use a smaller model`);
    }
    return null; // caller will fallback to rule-based
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
      user.jobSeeker?.skills,
      job.skillsRequired
    );

    // 2. Semantic similarity
    const resumeText = buildResumeText(user);
    const jobText = buildJobText(job);
    const { semanticScore, semanticPercent } = await getSemanticScore(resumeText, jobText);

    // 3. Hybrid score
    const finalRaw = 0.6 * skillScore + 0.4 * semanticScore;
    const matchScore = Math.round(finalRaw * 100);
    const skillScorePercent = Math.round(skillScore * 100);

    // 4. Suggestions — try Ollama, fallback to rule-based
    let suggestions, summaryRewrite, suggestionSource;

    const ollamaResult = await getOllamaSuggestions(
      missingSkills,
      matchScore,
      job.title || '',
      job.description || '',
      job.skillsRequired || [],
      matchedSkills,
      user.jobSeeker?.bio || user.jobSeeker?.summary || ''
    );

    if (ollamaResult) {
      suggestions = ollamaResult.suggestions;
      summaryRewrite = ollamaResult.summaryRewrite;
      suggestionSource = 'ollama';
      console.log(`✅ Ollama suggestions generated for job="${job.title}"`);
    } else {
      suggestions = ruleBasedSuggestions(missingSkills, matchScore, job.title || '');
      summaryRewrite = '';
      suggestionSource = 'rule';
      console.log(`ℹ Using rule-based suggestions for job="${job.title}" (Ollama unavailable)`);
    }

    // CRITICAL: Ensure all fields have safe defaults (never null/undefined)
    return {
      matchScore: typeof matchScore === 'number' ? matchScore : 0,
      skillScore: typeof skillScore === 'number' ? skillScore : 0,
      semanticScore: typeof semanticScore === 'number' ? semanticScore : 0,
      skillScorePercent: typeof skillScorePercent === 'number' ? skillScorePercent : 0,
      semanticPercent: typeof semanticPercent === 'number' ? semanticPercent : 0,
      matchedSkills: Array.isArray(matchedSkills) ? matchedSkills : [],
      missingSkills: Array.isArray(missingSkills) ? missingSkills : [],
      suggestions: Array.isArray(suggestions) ? suggestions : [],
      summaryRewrite: typeof summaryRewrite === 'string' ? summaryRewrite : '',
      suggestionSource: suggestionSource || 'rule',
      analyzedAt: new Date(),
      version: 'v1',
      // Track profile version used for this analysis
      profileUpdatedAtUsed: user.jobSeeker?.profileUpdatedAt || null,
      resumeParsedAtUsed: user.jobSeeker?.resumeParsedAt || null,
    };
  } catch (error) {
    console.error('❌ Error in computeJobMatch:', error);
    // Return safe fallback analysis instead of crashing
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
      version: 'v1',
      profileUpdatedAtUsed: user.jobSeeker?.profileUpdatedAt || null,
      resumeParsedAtUsed: user.jobSeeker?.resumeParsedAt || null,
    };
  }
}

// --------------- Cached analysis with upsert -----------------

/**
 * Get (or compute + cache) match analysis for a userId + jobId pair.
 *  - If cached result exists, analyzedAt ≤ CACHE_DAYS old, and user
 *    resumeParsedAt has not changed → return cache.
 *  - Otherwise re-compute, upsert, and return.
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
      !user.jobSeeker?.resumeParsedAt ||
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
 * 
 * @param {string} userId - User ID
 * @param {string[]} jobIds - Array of job IDs
 * @returns {Promise<Object>} Map of jobId to match score data
 */
async function getBatchMatchScores(userId, jobIds) {
  // Fetch all cached analyses for this user and the given jobIds
  const cached = await JobMatchAnalysis.find({
    userId,
    jobId: { $in: jobIds }
  }).select('jobId matchScore analyzedAt').lean();

  // Build result map
  const result = {};
  
  // Initialize all jobIds with missing status
  jobIds.forEach(jobId => {
    result[jobId] = {
      matchScore: null,
      analyzedAt: null,
      source: 'missing'
    };
  });

  // Populate cached values
  cached.forEach(entry => {
    const jobIdStr = entry.jobId.toString();
    result[jobIdStr] = {
      matchScore: entry.matchScore,
      analyzedAt: entry.analyzedAt,
      source: 'cache'
    };
  });

  return result;
}

// --------------- New: GET cached match with isOutdated flag -----------------

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

  // Check if analysis is outdated
  const userProfileUpdatedAt = user.jobSeeker?.profileUpdatedAt || null;
  const userResumeParsedAt = user.jobSeeker?.resumeParsedAt || null;
  const analysisProfileUpdatedAt = cached.profileUpdatedAtUsed || null;
  const analysisResumeParsedAt = cached.resumeParsedAtUsed || null;

  let isOutdated = false;

  // Profile updated after analysis was done
  if (userProfileUpdatedAt && analysisProfileUpdatedAt) {
    if (new Date(userProfileUpdatedAt) > new Date(analysisProfileUpdatedAt)) {
      isOutdated = true;
    }
  } else if (userProfileUpdatedAt && !analysisProfileUpdatedAt) {
    // User has profile update but analysis doesn't track it
    isOutdated = true;
  }

  // Resume parsed after analysis was done
  if (userResumeParsedAt && analysisResumeParsedAt) {
    if (new Date(userResumeParsedAt) > new Date(analysisResumeParsedAt)) {
      isOutdated = true;
    }
  } else if (userResumeParsedAt && !analysisResumeParsedAt) {
    // User has resume but analysis doesn't track it
    isOutdated = true;
  }

  return { analysis: cached, isOutdated };
}

// --------------- New: POST analyze (compute + upsert) -----------------

/**
 * Compute fresh match analysis and upsert into JobMatchAnalysis.
 * This is called when user explicitly clicks "Analyze My Match" or "Analyze Again".
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

  // Upsert (replace old analysis for this job)
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
  checkOllamaHealth,
};
