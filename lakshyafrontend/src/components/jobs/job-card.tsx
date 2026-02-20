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
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      {/* Company Logo Placeholder */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <span className="text-indigo-600 font-bold text-lg">
            {job.companyName?.charAt(0) || 'C'}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <Link
            to={`/job-seeker/jobs/${job._id}`}
            className="font-semibold text-gray-900 hover:text-indigo-600 line-clamp-1"
          >
            {job.title}
          </Link>
          <p className="text-sm text-gray-600 mt-0.5">{job.companyName}</p>
        </div>
      </div>

      {/* Location & Salary */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{job.location}</span>
        </div>
        
        {salaryDisplay && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{salaryDisplay}</span>
          </div>
        )}
      </div>

      {/* Job Description Preview */}
      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
        {job.description}
      </p>

      {/* AI Match Score & View Details */}
      <div className="mt-4 flex items-center justify-between">
        {showMatchScore && matchScore !== undefined && (
          <div className={`text-sm px-3 py-1 rounded-full ${getMatchScoreColor(matchScore)}`}>
            AI Match: {matchScore}%
          </div>
        )}
        <Link
          to={`/job-seeker/jobs/${job._id}`}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default JobCard;
