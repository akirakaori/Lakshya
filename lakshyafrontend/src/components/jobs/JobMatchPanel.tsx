import React, { useState, useEffect } from 'react';
import { useJobMatch, jobMatchScoresKeys, useAnalyzeJobMatch } from '../../hooks';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

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

  // ✅ ALL HOOKS AT THE TOP - ALWAYS CALLED IN SAME ORDER
  const { data, isLoading, error, refetch } = useJobMatch(jobId);
  const analyzeMutation = useAnalyzeJobMatch();
  const [copied, setCopied] = useState(false);

  // Invalidate batch match scores when single job match is successfully loaded
  useEffect(() => {
    if (data?.data) {
      queryClient.invalidateQueries({ queryKey: jobMatchScoresKeys.all });
    }
  }, [data, queryClient]);

  // Debug logging for outdated state (moved to top-level)
  useEffect(() => {
    if (data?.data) {
      const isOutdated = data.isOutdated || false;
      const analyzedAt = data.data.analyzedAt || new Date().toISOString();
      console.log('🔍 JobMatchPanel render - jobId:', jobId, 'isOutdated:', isOutdated, 'analyzedAt:', analyzedAt);
    }
  }, [jobId, data]);

  // ✅ HELPER FUNCTIONS (no hooks inside)
  const handleAnalyze = async () => {
    try {
      console.log('🔄 Starting analysis for jobId:', jobId);
      await analyzeMutation.mutateAsync(jobId);
      toast.success('Match analysis updated!');
    } catch (err: any) {
      console.error('❌ Analysis failed:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to analyze match';
      toast.error(errorMessage);
    }
  };

  const handleCopy = async (summaryRewrite: string) => {
    if (!summaryRewrite) return;
    try {
      await navigator.clipboard.writeText(summaryRewrite);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = summaryRewrite;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ✅ CONDITIONAL RENDERING AFTER ALL HOOKS
  
  // Show error UI if mutation failed
  if (analyzeMutation.isError && !data?.data) {
    const errorMessage = (analyzeMutation.error as any)?.response?.data?.message || 
                        (analyzeMutation.error as any)?.message || 
                        'Analysis failed. Please try again.';
    
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Match Score</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzeMutation.isPending}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {analyzeMutation.isPending ? 'Analyzing...' : 'Try Again'}
        </button>
      </div>
    );
  }

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

  if (error) {
    const errorStatus = (error as any)?.response?.status;
    const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message;
    
    let displayMessage = 'Failed to load match analysis. Please try again.';
    let actionText = 'Retry';
    
    if (errorStatus === 401 || errorStatus === 403) {
      displayMessage = 'Session not ready. Retrying...';
      actionText = 'Retry Now';
    } else if (errorStatus === 504 || errorMessage?.includes('timeout')) {
      displayMessage = 'Analysis is taking longer than expected. Please try again.';
      actionText = 'Try Again';
    } else if (!errorStatus) {
      displayMessage = 'Network error. Please check your connection and try again.';
      actionText = 'Retry';
    }
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Match Score</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">{displayMessage}</p>
          {errorMessage && (
            <p className="text-xs text-yellow-600 mt-1">{errorMessage}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={analyzeMutation.isPending}
            className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {actionText}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Now'}
          </button>
        </div>
      </div>
    );
  }

  // No analysis exists yet
  if (!data?.data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Match Score</h3>
        <p className="text-sm text-gray-500 mb-4">
          Get AI-powered insights on how well your profile matches this job.
        </p>
        <button
          onClick={handleAnalyze}
          disabled={analyzeMutation.isPending}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {analyzeMutation.isPending ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Analyze My Match
            </>
          )}
        </button>
      </div>
    );
  }

  // CRITICAL: Defensive rendering with safe defaults to prevent crashes
  const analysis = data.data;
  const matchScore = typeof analysis?.matchScore === 'number' ? analysis.matchScore : 0;
  const skillScorePercent = typeof analysis?.skillScorePercent === 'number' ? analysis.skillScorePercent : 0;
  const semanticPercent = typeof analysis?.semanticPercent === 'number' ? analysis.semanticPercent : 0;
  const matchedSkills = Array.isArray(analysis?.matchedSkills) ? analysis.matchedSkills : [];
  const missingSkills = Array.isArray(analysis?.missingSkills) ? analysis.missingSkills : [];
  const suggestions = Array.isArray(analysis?.suggestions) ? analysis.suggestions : [];
  const summaryRewrite = typeof analysis?.summaryRewrite === 'string' ? analysis.summaryRewrite : '';
  const suggestionSource = analysis?.suggestionSource || 'rule';
  const analyzedAt = analysis?.analyzedAt || new Date().toISOString();
  const isOutdated = data.isOutdated || false;

  console.log('🔍 JobMatchPanel rendering with safe data:', {
    matchScore,
    matchedSkillsCount: matchedSkills.length,
    missingSkillsCount: missingSkills.length,
    suggestionsCount: suggestions.length,
    isOutdated
  });

  const matchLabel =
    matchScore >= 75
      ? 'Great match! Your profile aligns well with this role.'
      : matchScore >= 50
        ? 'Moderate match — a few improvements can boost your fit.'
        : 'Low match — consider updating your profile before applying.';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900">AI Match Score</h3>

      {/* Outdated banner */}
      {isOutdated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-yellow-900 font-medium text-sm">Profile Updated</h4>
              <p className="text-yellow-700 text-xs mt-0.5">
                Your profile has changed. Recalculate match to see updated score.
              </p>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            className="mt-2 w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Again'}
          </button>
        </div>
      )}

      {/* Score ring */}
      <div className="flex flex-col items-center">
        <ScoreRing score={matchScore} />
        <p className="text-sm text-gray-500 text-center mt-2">{matchLabel}</p>
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2">
        <BreakdownBar label="Skills" percent={skillScorePercent} color="bg-indigo-500" />
        <BreakdownBar label="Semantic" percent={semanticPercent} color="bg-purple-500" />
      </div>

      {/* Matched skills */}
      {matchedSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Matched Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {matchedSkills.map((s, idx) => (
              <SkillChip key={`matched-${idx}-${s}`} skill={s} variant="matched" />
            ))}
          </div>
        </div>
      )}

      {/* Missing skills */}
      {missingSkills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Missing Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {missingSkills.map((s, idx) => (
              <SkillChip key={`missing-${idx}-${s}`} skill={s} variant="missing" />
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Suggestions
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              ({suggestionSource === 'ollama' ? 'AI-powered' : 'Rule-based'})
            </span>
          </h4>
          <ul className="space-y-1.5">
            {suggestions.map((tip, i) => (
              <li key={`suggestion-${i}`} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-indigo-500 mt-0.5 flex-shrink-0">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary rewrite */}
      {summaryRewrite && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Summary</h4>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 italic">
            "{summaryRewrite}"
          </div>
          <button
            onClick={() => handleCopy(summaryRewrite)}
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
        Analyzed {new Date(analyzedAt).toLocaleDateString()}
      </p>
    </div>
  );
};

export default JobMatchPanel;
