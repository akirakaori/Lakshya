import React from 'react';
import type { JobFilters } from '../services/job-service';

interface ActiveFiltersProps {
  filters: JobFilters;
  onRemoveFilter: (filterKey: keyof JobFilters) => void;
  onClearAll: () => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({ filters, onRemoveFilter, onClearAll }) => {
  // Map experience level values to display labels
  const EXPERIENCE_LABELS: Record<string, string> = {
    'entry': 'Entry Level',
    'mid': 'Mid Level',
    'senior': 'Senior Level',
    'lead': 'Lead / Manager',
    'executive': 'Executive',
  };

  // Helper to format experience levels for display
  const formatExperienceLevels = (levels: string[]): string => {
    return levels.map(level => EXPERIENCE_LABELS[level] || level).join(', ');
  };

  // Helper to format salary range
  const formatSalary = (min?: number, max?: number): string => {
    if (!min && !max) return '';
    if (min && max) return `Rs ${min.toLocaleString()} - Rs ${max.toLocaleString()}`;
    if (min) return `Rs ${min.toLocaleString()}+`;
    if (max) return `up to Rs ${max.toLocaleString()}`;
    return '';
  };

  // Helper to format posted within days
  const formatPostedWithin = (days?: number): string => {
    if (!days) return '';
    if (days === 1) return 'Last 24 hours';
    if (days === 7) return 'Last 7 days';
    if (days === 30) return 'Last 30 days';
    return `Last ${days} days`;
  };

  // Count active filters (excluding page and limit)
  const activeFilterKeys = Object.keys(filters).filter(
    key => key !== 'page' && key !== 'limit' && filters[key as keyof JobFilters]
  );
  
  const activeCount = activeFilterKeys.length;

  // If no active filters, don't render anything
  if (activeCount === 0) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Filters Applied ({activeCount})
        </h3>
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear All
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Keyword */}
        {filters.keyword && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border bg-blue-50 text-blue-700 border-blue-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="font-medium">Keyword:</span>
            <span>{filters.keyword}</span>
            <button
              onClick={() => onRemoveFilter('keyword')}
              className="ml-1 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
              aria-label="Remove keyword filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* Category */}
        {filters.category && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border bg-purple-50 text-purple-700 border-purple-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="font-medium">Category:</span>
            <span>{filters.category}</span>
            <button
              onClick={() => onRemoveFilter('category')}
              className="ml-1 hover:bg-purple-100 rounded-full p-0.5 transition-colors"
              aria-label="Remove category filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* Job Type */}
        {filters.jobType && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border bg-green-50 text-green-700 border-green-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{filters.jobType}</span>
            <button
              onClick={() => onRemoveFilter('jobType')}
              className="ml-1 hover:bg-green-100 rounded-full p-0.5 transition-colors"
              aria-label="Remove job type filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* Remote Type */}
        {filters.remoteType && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border bg-indigo-50 text-indigo-700 border-indigo-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{filters.remoteType}</span>
            <button
              onClick={() => onRemoveFilter('remoteType')}
              className="ml-1 hover:bg-indigo-100 rounded-full p-0.5 transition-colors"
              aria-label="Remove remote type filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* Company Size */}
        {filters.companySize && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border bg-yellow-50 text-yellow-700 border-yellow-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{filters.companySize} employees</span>
            <button
              onClick={() => onRemoveFilter('companySize')}
              className="ml-1 hover:bg-yellow-100 rounded-full p-0.5 transition-colors"
              aria-label="Remove company size filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* Location */}
        {filters.location && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border bg-teal-50 text-teal-700 border-teal-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{filters.location}</span>
            <button
              onClick={() => onRemoveFilter('location')}
              className="ml-1 hover:bg-teal-100 rounded-full p-0.5 transition-colors"
              aria-label="Remove location filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* Salary Range */}
        {(filters.salaryMin || filters.salaryMax) && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border bg-amber-50 text-amber-700 border-amber-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Salary:</span>
            <span>{formatSalary(filters.salaryMin, filters.salaryMax)}</span>
            <button
              onClick={() => {
                onRemoveFilter('salaryMin');
                onRemoveFilter('salaryMax');
              }}
              className="ml-1 hover:bg-amber-100 rounded-full p-0.5 transition-colors"
              aria-label="Remove salary filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* Experience Levels */}
        {filters.experienceLevels && filters.experienceLevels.length > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border bg-pink-50 text-pink-700 border-pink-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="font-medium">Experience:</span>
            <span>{formatExperienceLevels(filters.experienceLevels)}</span>
            <button
              onClick={() => onRemoveFilter('experienceLevels')}
              className="ml-1 hover:bg-pink-100 rounded-full p-0.5 transition-colors"
              aria-label="Remove experience filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* Posted Within */}
        {filters.postedWithinDays && filters.postedWithinDays > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border bg-cyan-50 text-cyan-700 border-cyan-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Posted:</span>
            <span>{formatPostedWithin(filters.postedWithinDays)}</span>
            <button
              onClick={() => onRemoveFilter('postedWithinDays')}
              className="ml-1 hover:bg-cyan-100 rounded-full p-0.5 transition-colors"
              aria-label="Remove posted date filter"
            >
              ✕
            </button>
          </div>
        )}

        {/* AI Match Score */}
        {filters.aiMatchMin && filters.aiMatchMin > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border bg-rose-50 text-rose-700 border-rose-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="font-medium">AI Match:</span>
            <span>≥ {filters.aiMatchMin}%</span>
            <button
              onClick={() => onRemoveFilter('aiMatchMin')}
              className="ml-1 hover:bg-rose-100 rounded-full p-0.5 transition-colors"
              aria-label="Remove AI match filter"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveFilters;
