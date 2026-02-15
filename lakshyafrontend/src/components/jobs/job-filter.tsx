import React, { useState, useEffect } from 'react';
import type { JobFilters } from '../../services/job-service';
import { formatCurrencyNPR } from '../../utils/currency';

interface JobFilterProps {
  filters: JobFilters;
  onFilterChange: (filters: JobFilters) => void;
  onClearFilters: () => void;
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const EXPERIENCE_LEVELS = ['Entry-level', 'Mid-level', 'Senior-level'];
const CATEGORIES = [
  'Software Development',
  'Data Science',
  'Design',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
  'Other'
];

const MAX_SALARY = 500000;
const MIN_SALARY = 0;

const JobFilter: React.FC<JobFilterProps> = ({ filters, onFilterChange, onClearFilters }) => {
  // Draft filters (local state, changes immediately on UI interaction)
  const [draftFilters, setDraftFilters] = useState<JobFilters>(filters);

  // Sync draft with parent when parent filters change (e.g., on clear)
  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const handleInputChange = (field: keyof JobFilters, value: any) => {
    setDraftFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleJobTypeChange = (jobType: string) => {
    setDraftFilters(prev => ({
      ...prev,
      jobType: prev.jobType === jobType ? undefined : jobType
    }));
  };

  const handleExperienceLevelToggle = (level: string) => {
    setDraftFilters(prev => {
      const current = prev.experienceLevels || [];
      const updated = current.includes(level)
        ? current.filter(l => l !== level)
        : [...current, level];
      return {
        ...prev,
        experienceLevels: updated.length > 0 ? updated : undefined
      };
    });
  };

  const handleSalaryMinChange = (value: number) => {
    setDraftFilters(prev => {
      const newMin = value;
      const currentMax = prev.salaryMax || MAX_SALARY;
      // Ensure min doesn't exceed max
      return {
        ...prev,
        salaryMin: Math.min(newMin, currentMax)
      };
    });
  };

  const handleSalaryMaxChange = (value: number) => {
    setDraftFilters(prev => {
      const newMax = value;
      const currentMin = prev.salaryMin || MIN_SALARY;
      // Ensure max doesn't go below min
      return {
        ...prev,
        salaryMax: Math.max(newMax, currentMin)
      };
    });
  };

  const handleApplyFilters = () => {
    // Apply draft filters to parent (triggers API call)
    onFilterChange(draftFilters);
  };

  const handleClear = () => {
    // Reset both draft and applied
    setDraftFilters({});
    onClearFilters();
  };

  const salaryMin = draftFilters.salaryMin || MIN_SALARY;
  const salaryMax = draftFilters.salaryMax || MAX_SALARY;
  const aiMatchMin = draftFilters.aiMatchMin || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {Object.keys(draftFilters).length > 0 && (
          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
            Active
          </span>
        )}
      </div>
      
      {/* Category */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          value={draftFilters.category || ''}
          onChange={(e) => handleInputChange('category', e.target.value || undefined)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Job Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Type
        </label>
        <div className="space-y-2">
          {JOB_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="jobType"
                checked={draftFilters.jobType === type}
                onChange={() => handleJobTypeChange(type)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="text-sm text-gray-600">{type}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="jobType"
              checked={!draftFilters.jobType}
              onChange={() => setDraftFilters(prev => ({ ...prev, jobType: undefined }))}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <span className="text-sm text-gray-600">All Types</span>
          </label>
        </div>
      </div>

      {/* Salary Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Salary Range
        </label>
        
        {/* Display selected values */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <span className="text-indigo-600 font-medium">
            Min: {formatCurrencyNPR(salaryMin)}
          </span>
          <span className="text-indigo-600 font-medium">
            Max: {formatCurrencyNPR(salaryMax)}
          </span>
        </div>

        {/* Min Salary Slider */}
        <div className="mb-2">
          <label className="text-xs text-gray-500 mb-1 block">Minimum</label>
          <input
            type="range"
            min={MIN_SALARY}
            max={MAX_SALARY}
            step="10000"
            value={salaryMin}
            onChange={(e) => handleSalaryMinChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            aria-label="Minimum salary"
          />
        </div>

        {/* Max Salary Slider */}
        <div className="mb-2">
          <label className="text-xs text-gray-500 mb-1 block">Maximum</label>
          <input
            type="range"
            min={MIN_SALARY}
            max={MAX_SALARY}
            step="10000"
            value={salaryMax}
            onChange={(e) => handleSalaryMaxChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            aria-label="Maximum salary"
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatCurrencyNPR(MIN_SALARY)}</span>
          <span>{formatCurrencyNPR(MAX_SALARY)}</span>
        </div>
      </div>

      {/* Location */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          placeholder="e.g., Kathmandu, Remote"
          value={draftFilters.location || ''}
          onChange={(e) => handleInputChange('location', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
      </div>

      {/* Experience Level */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Experience Level
        </label>
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <label key={level} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draftFilters.experienceLevels?.includes(level) || false}
                onChange={() => handleExperienceLevelToggle(level)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* AI Match Score Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Match Score (Minimum)
        </label>
        
        {/* Display current value */}
        <div className="text-center mb-2">
          <span className="text-2xl font-bold text-indigo-600">
            {aiMatchMin}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={aiMatchMin}
          onChange={(e) => handleInputChange('aiMatchMin', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          aria-label="Minimum AI match score"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <button
          onClick={handleApplyFilters}
          className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClear}
          className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default JobFilter;
