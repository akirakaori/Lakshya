import React from 'react';
import type { Application } from '../../services/application-service';
import type { Job } from '../../services/job-service';

interface ApplicationCardProps {
  application: Application;
  variant?: 'card' | 'row';
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, variant = 'card' }) => {
  const job = typeof application.jobId === 'object' ? application.jobId as Job : null;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-700';
      case 'shortlisted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'applied':
        return 'Pending';
      case 'shortlisted':
        return 'Interview';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  // Generate a random match score (for demo)
  const aiMatchScore = Math.floor(Math.random() * 25) + 75;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (variant === 'row') {
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4">
          <div className="font-medium text-gray-900">{job?.title || 'Job Title'}</div>
        </td>
        <td className="px-6 py-4 text-gray-600">{job?.companyName || 'Company'}</td>
        <td className="px-6 py-4 text-gray-600">{formatDate(application.createdAt)}</td>
        <td className="px-6 py-4">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
            {getStatusLabel(application.status)}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
            {aiMatchScore}%
          </span>
        </td>
      </tr>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-600 font-bold text-lg">
              {job?.companyName?.charAt(0) || 'C'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{job?.title || 'Job Title'}</h3>
            <p className="text-sm text-gray-600 mt-0.5">{job?.companyName || 'Company'}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
          {getStatusLabel(application.status)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {job?.location || 'Location'}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(application.createdAt)}
          </span>
        </div>
        <span className="text-green-600 font-medium">✓ {aiMatchScore}% Match</span>
      </div>
    </div>
  );
};

export default ApplicationCard;
