import React from 'react';
import { Link } from 'react-router-dom';
import type { Job } from '../../services/job-service';

interface JobCardProps {
  job: Job;
  variant?: 'default' | 'compact';
  showMatchScore?: boolean;
  matchScore?: number;
}

const formatSalary = (salary: Job['salary']) => {
  if (!salary) return null;
  if (typeof salary === 'string') return salary;
  if (!salary.min && !salary.max) return null;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: salary.currency || 'USD',
    maximumFractionDigits: 0,
  });
  return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
};

const JobCard: React.FC<JobCardProps> = ({ job, variant = 'default', showMatchScore = false, matchScore }) => {
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700';
    if (score >= 75) return 'bg-blue-100 text-blue-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };
  
  const salaryDisplay = formatSalary(job.salary);

  if (variant === 'compact') {
    return (
      <Link
        to={`/job-seeker/jobs/${job._id}`}
        className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 hover:text-indigo-600">{job.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{job.companyName}</p>
          </div>
          {showMatchScore && matchScore !== undefined && (
            <span className={`text-sm px-2 py-1 rounded-full ${getMatchScoreColor(matchScore)}`}>
              {matchScore}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">{job.location}</p>
      </Link>
    );
  }

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Decorative Top Accent Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
      
      <div className="p-5">
        {/* Header: Logo + Title + Save Icon */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <span className="text-blue-600 font-bold text-lg">
              {job.companyName?.charAt(0) || 'C'}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-900 font-semibold text-base sm:text-lg line-clamp-1 group-hover:text-blue-600 transition">
              {job.title}
            </h3>
            <p className="text-slate-500 text-sm mt-0.5">{job.companyName}</p>
            
            {/* Location */}
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{job.location}</span>
            </div>
          </div>

          {/* Optional Bookmark/Save Icon Placeholder */}
          <button className="text-slate-400 hover:text-blue-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {/* Meta Badges Row */}
        <div className="flex flex-wrap gap-2 mt-4">
          {job.jobType && (
            <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium">
              {job.jobType}
            </span>
          )}
          {job.experienceLevel && (
            <span className="inline-flex items-center rounded-full bg-purple-50 text-purple-700 px-3 py-1 text-xs font-medium">
              {job.experienceLevel}
            </span>
          )}
          {salaryDisplay && (
            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-medium">
              {salaryDisplay}
            </span>
          )}
        </div>

        {/* Job Description Preview */}
        <p className="text-sm text-slate-600 mt-3 line-clamp-3">
          {job.description}
        </p>

        {/* Bottom Action Row */}
        <div className="mt-5 flex items-center justify-between gap-3">
          {showMatchScore && matchScore !== undefined ? (
            <div className="flex items-center gap-2">
              <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${getMatchScoreColor(matchScore)}`}>
                {matchScore}% Match
              </div>
            </div>
          ) : (
            <div></div>
          )}
          <div className="flex items-center gap-2">
            <Link
              to={`/job-seeker/jobs/${job._id}`}
              className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
