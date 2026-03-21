import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout, StatsCard, LoadingSpinner } from '../../components';
import { useAuth } from '../../context/auth-context';
import { useMyApplications, useJobMatchScores, useRecommendedJobs } from '../../hooks';
import { getStatusLabel, getStatusBadgeClass } from '../../utils/applicationStatus';
import type { Job, RecommendedJob } from '../../services';

const JobSeekerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: applicationsData, isLoading } = useMyApplications();
  const { data: recommendationsData, isLoading: recommendationsLoading } = useRecommendedJobs();

  const applications = applicationsData?.data || [];
  const totalApplications = applications.length;
  const recommendations: RecommendedJob[] = recommendationsData?.data || [];

  // Recent applications (last 3)
  const recentApplications = applications.slice(0, 3);

  // Extract job IDs from recent applications for batch fetch
  const jobIds = useMemo(() => {
    return recentApplications
      .map(app => {
        const job = typeof app.jobId === 'object' ? app.jobId as Job : null;
        return typeof app.jobId === 'string' ? app.jobId : job?._id;
      })
      .filter((id): id is string => !!id);
  }, [recentApplications]);

  // Fetch match scores for recent applications
  const { data: matchScoresResponse } = useJobMatchScores(jobIds.length > 0 ? jobIds : undefined);
  const matchScores = matchScoresResponse?.data || {};

  // Resume strength score (demo value)
  const resumeStrengthScore = 85;

  return (
    <DashboardLayout variant="job-seeker">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8 overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(37,99,235,0.95),_rgba(79,70,229,0.92)_52%,_rgba(14,165,233,0.85)_100%)] px-6 py-8 text-white shadow-[0_24px_70px_rgba(37,99,235,0.2)] dark:border-slate-800/80">
          <h1 className="text-2xl font-bold text-white">
            Hello {user?.name?.split(' ')[0]}, ready to find your target?
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-50">
            Here's an overview of your job search progress and personalized recommendations.
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading your dashboard..." />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Applied Jobs */}
              <StatsCard
                title="Applied Jobs"
                value={totalApplications}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />

              {/* Resume Strength Score */}
              <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium text-center">Resume Strength Score</p>
                <div className="flex flex-col items-center mt-4">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-green-500"
                        strokeWidth="8"
                        strokeDasharray={`${resumeStrengthScore * 2.51} 251`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">{resumeStrengthScore}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 text-center mt-2">
                    Looks great! Keep refining with AI suggestions.
                  </p>
                </div>
              </div>

              {/* Recommended Jobs */}
              <StatsCard
                title="Recommended Jobs"
                value={recommendations.length}
                color="green"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Applications */}
              <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Recent Applications</h3>
                
                {recentApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-slate-400">No applications yet</p>
                    <Link
                      to="/job-seeker/browse-jobs"
                      className="text-indigo-600 hover:text-indigo-700 font-medium mt-2 inline-block"
                    >
                      Browse Jobs →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentApplications.map((application) => {
                      const job = typeof application.jobId === 'object' ? application.jobId as Job : null;
                      const jobId = typeof application.jobId === 'string' ? application.jobId : job?._id;
                      const matchData = jobId ? matchScores[jobId] : null;
                      const matchScore = matchData?.matchScore;
                      
                      return (
                        <div key={application._id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-800 last:border-0">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-slate-100">{job?.title || 'Job'}</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{job?.companyName || 'Company'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(application.status)}`}>
                              {getStatusLabel(application.status)}
                            </span>
                            {matchScore !== null && matchScore !== undefined && (
                              <span className="text-green-600 text-sm font-medium">✓ {matchScore}% Match</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <Link
                  to="/job-seeker/my-applications"
                  className="block text-center text-indigo-600 hover:text-indigo-700 font-medium mt-4"
                >
                  View All Applications
                </Link>
              </div>

              {/* Resume Enhancement Tips */}
              <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Resume Enhancement Tips</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-300">
                      Tailor your resume keywords to each job description using the AI Analyzer.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-300">
                      Quantify your achievements with numbers and metrics to stand out.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-300">
                      Ensure consistent formatting and clear readability for ATS compatibility.
                    </p>
                  </div>
                </div>
                
                <Link
                  to="/job-seeker/profile"
                  className="block text-center text-indigo-600 hover:text-indigo-700 font-medium mt-6"
                >
                  Analyze My Resume
                </Link>
              </div>
            </div>

            {/* ── Recommended Jobs For You ── */}
            <div className="mt-6 rounded-2xl border border-white/70 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Recommended Jobs For You</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                    Matched to your skills, location and experience
                  </p>
                </div>
                <Link
                  to="/job-seeker/browse-jobs"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Browse All →
                </Link>
              </div>

              {recommendationsLoading ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner text="Finding best matches…" />
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-10">
                  <svg
                    className="w-12 h-12 text-gray-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-slate-400 font-medium">No recommendations yet</p>
                  <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                    Complete your profile and upload your resume to get personalised job suggestions.
                  </p>
                  <Link
                    to="/job-seeker/profile"
                    className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Complete Profile →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {recommendations.map((job) => (
                    <RecommendationCard key={job._id.toString()} job={job} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

// ── Recommendation Card ──────────────────────────────────────────────────────

interface RecommendationCardProps {
  job: RecommendedJob;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ job }) => {
  const score = job.recommendationScore;
  const scoreColor =
    score >= 75 ? 'bg-green-100 text-green-700' :
    score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400';

  return (
    <div className="border border-gray-200 dark:border-slate-800 rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">{job.title}</h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{job.companyName}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${scoreColor}`}>
          {job.isLowConfidence ? '~' : ''}{score}% match
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location}
        </span>
        {job.jobType && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {job.jobType}
          </span>
        )}
      </div>

      {/* Matched skills */}
      {job.matchedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.matchedSkills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
            >
              {skill}
            </span>
          ))}
          {job.matchedSkills.length > 4 && (
            <span className="px-1.5 py-0.5 bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-slate-400 rounded text-xs">
              +{job.matchedSkills.length - 4} more
            </span>
          )}
        </div>
      )}

      {job.isLowConfidence && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
          Add skills to your profile for better matches
        </p>
      )}

      {/* CTA */}
      <Link
        to={`/jobs/${job._id}`}
        className="mt-auto block text-center text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 rounded-md py-1.5 transition-colors"
      >
        View Details
      </Link>
    </div>
  );
};

export default JobSeekerDashboard;

