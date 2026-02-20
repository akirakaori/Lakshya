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
const OLLAMA_TIMEOUT = 8000; // 8 seconds
const SEMANTIC_TIMEOUT = 7000; // 7 seconds
const CACHE_DAYS = 7;

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

// --------------- Ollama Suggestions (optional, with timeout + fallback) -----------------

async function getOllamaSuggestions(missingSkills, matchScore, jobTitle, resumeSummary) {
  try {
    const prompt = `You are a career advisor AI. Given the following data, produce ONLY valid JSON (no markdown, no extra text) with this exact structure:
{"suggestions":["tip1","tip2","tip3"],"summaryRewrite":"One or two polished sentences rewriting the candidate summary for the job."}

Data:
- Job title: "${jobTitle}"
- Match score: ${matchScore}%
- Missing skills: ${missingSkills.join(', ') || 'none'}
- Current summary: "${(resumeSummary || '').slice(0, 300)}"

Requirements:
- suggestions: 3-5 actionable, concise tips
- summaryRewrite: 1-2 sentence polished rewrite of the candidate summary targeted at the job
- Return ONLY the JSON object, nothing else`;

    const { data } = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      },
      { timeout: OLLAMA_TIMEOUT }
    );

    // Try to extract JSON from response
    const raw = (data.response || '').trim();
    // Attempt direct parse first
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract JSON object from potential surrounding text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON in Ollama response');
      }
    }

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s) => typeof s === 'string').slice(0, 5)
      : [];
    const summaryRewrite = typeof parsed.summaryRewrite === 'string' ? parsed.summaryRewrite : '';

    if (suggestions.length === 0) throw new Error('Ollama returned empty suggestions');

    return { suggestions, summaryRewrite, source: 'ollama' };
  } catch (err) {
    console.warn('⚠ Ollama suggestions failed, falling back to rule-based:', err.message);
    return null; // caller will fallback
  }
}

// --------------- Main: computeJobMatch -----------------

/**
 * Compute full match analysis for a given user & job.
 * Returns the analysis object (not yet saved).
 */
async function computeJobMatch(user, job) {
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
    user.jobSeeker?.bio || user.jobSeeker?.summary || ''
  );

  if (ollamaResult) {
    suggestions = ollamaResult.suggestions;
    summaryRewrite = ollamaResult.summaryRewrite;
    suggestionSource = 'ollama';
  } else {
    suggestions = ruleBasedSuggestions(missingSkills, matchScore, job.title || '');
    summaryRewrite = '';
    suggestionSource = 'rule';
  }

  return {
    matchScore,
    skillScore,
    semanticScore,
    skillScorePercent,
    semanticPercent,
    matchedSkills,
    missingSkills,
    suggestions,
    summaryRewrite,
    suggestionSource,
    analyzedAt: new Date(),
    version: 1,
  };
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

module.exports = {
  computeJobMatch,
  getOrComputeMatch,
  getBatchMatchScores,
  computeSkillMatch,
  normalizeSkill,
  ruleBasedSuggestions,
};
