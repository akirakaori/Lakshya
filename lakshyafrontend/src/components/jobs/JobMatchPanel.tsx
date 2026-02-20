import React, { useState, useEffect } from 'react';
import { useJobMatch, jobMatchScoresKeys } from '../../hooks';
import { useQueryClient } from '@tanstack/react-query';
import type { JobMatchAnalysis } from '../../services';

interface JobMatchPanelProps {
  jobId: string;
}

/* ---------- Score ring visual ---------- */
const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 120 }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-400';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-200"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <circle
          className={color}
          strokeWidth="8"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${color}`}>{score}%</span>
      </div>
    </div>
  );
};

/* ---------- Breakdown bar ---------- */
const BreakdownBar: React.FC<{ label: string; percent: number; color: string }> = ({
  label,
  percent,
  color,
}) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-gray-500 w-20 text-right">{label}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(percent, 100)}%`, transition: 'width 0.5s ease' }}
      />
    </div>
    <span className="text-xs font-medium text-gray-700 w-10">{percent}%</span>
  </div>
);

/* ---------- Skill chip ---------- */
const SkillChip: React.FC<{ skill: string; variant: 'matched' | 'missing' }> = ({
  skill,
  variant,
}) => {
  const cls =
    variant === 'matched'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-red-50 text-red-600 border-red-200';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {variant === 'matched' ? '✓ ' : '✗ '}
      {skill}
    </span>
  );
};

/* ---------- Main panel ---------- */
const JobMatchPanel: React.FC<JobMatchPanelProps> = ({ jobId }) => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useJobMatch(jobId);
  const [copied, setCopied] = useState(false);

  // Invalidate batch match scores when single job match is successfully loaded
  useEffect(() => {
    if (data?.data) {
      // Invalidate all batch match scores queries to ensure tables update
      queryClient.invalidateQueries({ queryKey: jobMatchScoresKeys.all });
    }
  }, [data, queryClient]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
        <div className="flex justify-center mb-4">
          <div className="w-28 h-28 bg-gray-200 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Match Score</h3>
        <p className="text-sm text-gray-500">
          Unable to compute match score. Make sure your profile has skills and a resume uploaded.
        </p>
      </div>
    );
  }

  const m: JobMatchAnalysis = data.data;

  const handleCopy = async () => {
    if (!m.summaryRewrite) return;
    try {
      await navigator.clipboard.writeText(m.summaryRewrite);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = m.summaryRewrite;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const matchLabel =
    m.matchScore >= 75
      ? 'Great match! Your profile aligns well with this role.'
      : m.matchScore >= 50
        ? 'Moderate match — a few improvements can boost your fit.'
        : 'Low match — consider updating your profile before applying.';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900">AI Match Score</h3>

      {/* Score ring */}
      <div className="flex flex-col items-center">
        <ScoreRing score={m.matchScore} />
        <p className="text-sm text-gray-500 text-center mt-2">{matchLabel}</p>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2">
        <BreakdownBar label="Skills" percent={m.skillScorePercent} color="bg-indigo-500" />
        <BreakdownBar label="Semantic" percent={m.semanticPercent} color="bg-purple-500" />
      </div>

      {/* Matched skills */}
      {m.matchedSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Matched Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {m.matchedSkills.map((s) => (
              <SkillChip key={s} skill={s} variant="matched" />
            ))}
          </div>
        </div>
      )}

      {/* Missing skills */}
      {m.missingSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Missing Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {m.missingSkills.map((s) => (
              <SkillChip key={s} skill={s} variant="missing" />
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {m.suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Suggestions
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              ({m.suggestionSource === 'ollama' ? 'AI-powered' : 'Rule-based'})
            </span>
          </h4>
          <ul className="space-y-1.5">
            {m.suggestions.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-indigo-500 mt-0.5 flex-shrink-0">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary rewrite */}
      {m.summaryRewrite && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Summary</h4>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 italic">
            "{m.summaryRewrite}"
          </div>
          <button
            onClick={handleCopy}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center">
        Analyzed {new Date(m.analyzedAt).toLocaleDateString()}
      </p>
    </div>
  );
};

export default JobMatchPanel;
