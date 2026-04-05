import React from 'react';
import type { JobFilters } from '../services/job-service';

interface ActiveFiltersProps {
  filters: JobFilters;
  onRemoveFilter: (filterKey: keyof JobFilters) => void;
  onClearAll: () => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({ filters, onRemoveFilter, onClearAll }) => {
  const EXPERIENCE_LABELS: Record<string, string> = {
    entry: 'Entry Level',
    mid: 'Mid Level',
    senior: 'Senior Level',
    lead: 'Lead / Manager',
    executive: 'Executive',
  };

  const formatExperienceLevels = (levels: string[]): string => {
    return levels.map(level => EXPERIENCE_LABELS[level] || level).join(', ');
  };

  const formatSalary = (min?: number, max?: number): string => {
    if (!min && !max) return '';
    if (min && max) return `Rs ${min.toLocaleString()} - Rs ${max.toLocaleString()}`;
    if (min) return `Rs ${min.toLocaleString()}+`;
    if (max) return `up to Rs ${max.toLocaleString()}`;
    return '';
  };

  const formatPostedWithin = (days?: number): string => {
    if (!days) return '';
    if (days === 1) return 'Last 24 hours';
    if (days === 7) return 'Last 7 days';
    if (days === 30) return 'Last 30 days';
    return `Last ${days} days`;
  };

  const activeFilterKeys = Object.keys(filters).filter(
    key => key !== 'page' && key !== 'limit' && filters[key as keyof JobFilters]
  );

  const activeCount = activeFilterKeys.length;

  if (activeCount === 0) {
    return null;
  }

  const chipClass = 'inline-flex items-center gap-1.5 border px-2 py-1 text-[12px] font-medium';
  const removeButtonClass = 'ml-1 p-0.5 transition-colors';

  return (
    <div className="mb-4 border border-[#E5E7EB] bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#111827]">
          Filters Applied ({activeCount})
        </h3>
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 text-[13px] font-medium text-[#2563EB] transition-colors hover:text-blue-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear All
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.keyword && (
          <div className={`${chipClass} border-blue-200 bg-blue-50 text-blue-700`}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Keyword:</span>
            <span>{filters.keyword}</span>
            <button onClick={() => onRemoveFilter('keyword')} className={`${removeButtonClass} hover:bg-blue-100`} aria-label="Remove keyword filter">×</button>
          </div>
        )}

        {filters.category && (
          <div className={`${chipClass} border-violet-200 bg-violet-50 text-violet-700`}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Category:</span>
            <span>{filters.category}</span>
            <button onClick={() => onRemoveFilter('category')} className={`${removeButtonClass} hover:bg-violet-100`} aria-label="Remove category filter">×</button>
          </div>
        )}

        {filters.jobType && (
          <div className={`${chipClass} border-green-200 bg-green-50 text-green-700`}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{filters.jobType}</span>
            <button onClick={() => onRemoveFilter('jobType')} className={`${removeButtonClass} hover:bg-green-100`} aria-label="Remove job type filter">×</button>
          </div>
        )}

        {filters.remoteType && (
          <div className={`${chipClass} border-blue-200 bg-blue-50 text-blue-700`}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{filters.remoteType}</span>
            <button onClick={() => onRemoveFilter('remoteType')} className={`${removeButtonClass} hover:bg-blue-100`} aria-label="Remove remote type filter">×</button>
          </div>
        )}

        {filters.companySize && (
          <div className={`${chipClass} border-yellow-200 bg-yellow-50 text-yellow-700`}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{filters.companySize} employees</span>
            <button onClick={() => onRemoveFilter('companySize')} className={`${removeButtonClass} hover:bg-yellow-100`} aria-label="Remove company size filter">×</button>
          </div>
        )}

        {filters.location && (
          <div className={`${chipClass} border-cyan-200 bg-cyan-50 text-cyan-700`}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{filters.location}</span>
            <button onClick={() => onRemoveFilter('location')} className={`${removeButtonClass} hover:bg-cyan-100`} aria-label="Remove location filter">×</button>
          </div>
        )}

        {(filters.salaryMin || filters.salaryMax) && (
          <div className={`${chipClass} border-amber-200 bg-amber-50 text-amber-700`}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Salary:</span>
            <span>{formatSalary(filters.salaryMin, filters.salaryMax)}</span>
            <button
              onClick={() => {
                onRemoveFilter('salaryMin');
                onRemoveFilter('salaryMax');
              }}
              className={`${removeButtonClass} hover:bg-amber-100`}
              aria-label="Remove salary filter"
            >
              ×
            </button>
          </div>
        )}

        {filters.experienceLevels && filters.experienceLevels.length > 0 && (
          <div className={`${chipClass} border-pink-200 bg-pink-50 text-pink-700`}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span>Experience:</span>
            <span>{formatExperienceLevels(filters.experienceLevels)}</span>
            <button onClick={() => onRemoveFilter('experienceLevels')} className={`${removeButtonClass} hover:bg-pink-100`} aria-label="Remove experience filter">×</button>
          </div>
        )}

        {filters.postedWithinDays && filters.postedWithinDays > 0 && (
          <div className={`${chipClass} border-cyan-200 bg-cyan-50 text-cyan-700`}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Posted:</span>
            <span>{formatPostedWithin(filters.postedWithinDays)}</span>
            <button onClick={() => onRemoveFilter('postedWithinDays')} className={`${removeButtonClass} hover:bg-cyan-100`} aria-label="Remove posted date filter">×</button>
          </div>
        )}

        {filters.aiMatchMin && filters.aiMatchMin > 0 && (
          <div className={`${chipClass} border-rose-200 bg-rose-50 text-rose-700`}>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>AI Match:</span>
            <span>≥ {filters.aiMatchMin}%</span>
            <button onClick={() => onRemoveFilter('aiMatchMin')} className={`${removeButtonClass} hover:bg-rose-100`} aria-label="Remove AI match filter">×</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveFilters;
