import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout, StatsCard, LoadingSpinner } from '../../components';
import { useAuth } from '../../context/auth-context';
import { useMyApplications, useJobMatchScores } from '../../hooks';
import { getStatusLabel, getStatusBadgeClass } from '../../utils/applicationStatus';
import type { Job } from '../../services';

const JobSeekerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: applicationsData, isLoading } = useMyApplications();

  const applications = applicationsData?.data || [];
  const totalApplications = applications.length;

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hello {user?.name?.split(' ')[0]}, ready to find your target?
          </h1>
          <p className="text-gray-600 mt-1">
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
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 font-medium text-center">Resume Strength Score</p>
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
                      <span className="text-2xl font-bold text-gray-900">{resumeStrengthScore}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Looks great! Keep refining with AI suggestions.
                  </p>
                </div>
              </div>

              {/* Recommended Jobs */}
              <StatsCard
                title="Recommended Jobs"
                value={124}
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
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
                
                {recentApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No applications yet</p>
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
                        <div key={application._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div>
                            <h4 className="font-medium text-gray-900">{job?.title || 'Job'}</h4>
                            <p className="text-sm text-gray-500">{job?.companyName || 'Company'}</p>
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
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume Enhancement Tips</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      Tailor your resume keywords to each job description using the AI Analyzer.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      Quantify your achievements with numbers and metrics to stand out.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobSeekerDashboard;
