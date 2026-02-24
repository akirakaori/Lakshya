import React, { useEffect } from 'react';
import type { JobFilters } from '../../services/job-service';
import { formatCurrencyNPR } from '../../utils/currency';
import { useForm } from 'react-hook-form';

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
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm<JobFilters>({
    defaultValues: filters,
  });

  // Sync with parent filters when they change externally (e.g., on clear)
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  const experienceLevels = watch('experienceLevels') || [];
  const salaryMin = watch('salaryMin') || MIN_SALARY;
  const salaryMax = watch('salaryMax') || MAX_SALARY;
  const aiMatchMin = watch('aiMatchMin') || 0;

  const handleExperienceLevelToggle = (level: string) => {
    const current = experienceLevels;
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    setValue('experienceLevels', updated.length > 0 ? updated : undefined);
  };

  const onApplyFilters = (data: JobFilters) => {
    // Remove undefined values before applying
    const cleanedFilters = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
    ) as JobFilters;
    onFilterChange(cleanedFilters);
  };

  const handleClear = () => {
    reset({});
    onClearFilters();
  };

  const hasActiveFilters = Object.values(watch()).some(
    v => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
            Active
          </span>
        )}
      </div>
      
      <form onSubmit={handleSubmit(onApplyFilters)} className="space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            {...register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Type
          </label>
          <div className="space-y-2">
            {JOB_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={type}
                  {...register('jobType')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-sm text-gray-600">{type}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value=""
                {...register('jobType')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="text-sm text-gray-600">All Types</span>
            </label>
          </div>
        </div>

        {/* Salary Range */}
        <div>
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
              {...register('salaryMin', {
                valueAsNumber: true,
                onChange: (e) => {
                  const newMin = parseInt(e.target.value);
                  const currentMax = watch('salaryMax') || MAX_SALARY;
                  if (newMin > currentMax) {
                    setValue('salaryMin', currentMax);
                  }
                },
              })}
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
              {...register('salaryMax', {
                valueAsNumber: true,
                onChange: (e) => {
                  const newMax = parseInt(e.target.value);
                  const currentMin = watch('salaryMin') || MIN_SALARY;
                  if (newMax < currentMin) {
                    setValue('salaryMax', currentMin);
                  }
                },
              })}
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            placeholder="e.g., Kathmandu, Remote"
            {...register('location')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience Level
          </label>
          <div className="space-y-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <label key={level} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={experienceLevels.includes(level)}
                  onChange={() => handleExperienceLevelToggle(level)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* AI Match Score Filter */}
        <div>
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
            {...register('aiMatchMin', { valueAsNumber: true })}
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
            type="submit"
            className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            Clear All Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobFilter;
