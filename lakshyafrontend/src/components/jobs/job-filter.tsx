import React, { useEffect } from 'react';
import type { JobFilters } from '../../services/job-service';
import { formatCurrencyNPR } from '../../utils/currency';
import { useForm, Controller } from 'react-hook-form';
import CategoryDropdown from '../CategoryDropdown';

interface JobFilterProps {
  filters: JobFilters;
  onFilterChange: (filters: JobFilters) => void;
  onClearFilters: () => void;
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const REMOTE_TYPES = ['Remote', 'Onsite', 'Hybrid'];

// CRITICAL: These values MUST match database schema in post-job.tsx
// Database stores: 'entry', 'mid', 'senior', 'lead', 'executive'
const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'lead', label: 'Lead / Manager' },
  { value: 'executive', label: 'Executive' },
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const POSTED_WITHIN_OPTIONS = [
  { label: 'Any time', value: 0 },
  { label: 'Last 24 hours', value: 1 },
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
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
    control,
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
    setValue('experienceLevels', updated.length > 0 ? updated : undefined);    console.log('[JobFilter] 🎯 Experience level toggled:', level);
    console.log('[JobFilter] 🎯 Updated experienceLevels:', updated);  };

  const onApplyFilters = (data: JobFilters) => {
    console.log('[JobFilter] 🔍 Applying filters - RAW data:', data);
    
    // Build clean filters object - only include values that are actually selected
    const cleanedFilters: JobFilters = {};
    
    // Keyword (string)
    if (data.keyword && data.keyword.trim()) {
      cleanedFilters.keyword = data.keyword.trim();
    }
    
    // Category (string) - CRITICAL: Must be exact match from dropdown
    if (data.category && data.category.trim()) {
      const trimmedCategory = data.category.trim();
      cleanedFilters.category = trimmedCategory;
      console.log('[JobFilter] 📂 Category filter selected:');
      console.log('  - Original:', data.category);
      console.log('  - Trimmed:', trimmedCategory);
      console.log('  - Length:', trimmedCategory.length);
      console.log('  - Char codes:', Array.from(trimmedCategory).map((c, i) => `[${i}]='${c}'(${c.charCodeAt(0)})`));
    }
    
    // Location (string)
    if (data.location && data.location.trim()) {
      cleanedFilters.location = data.location.trim();
    }
    
    // Job Type (string)
    if (data.jobType && data.jobType.trim()) {
      cleanedFilters.jobType = data.jobType.trim();
    }
    
    // Remote Type (string)
    if (data.remoteType && data.remoteType.trim()) {
      cleanedFilters.remoteType = data.remoteType.trim();
    }
    
    // Company Size (string)
    if (data.companySize && data.companySize.trim()) {
      cleanedFilters.companySize = data.companySize.trim();
    }
    
    // Salary Range (only include if actually set and > 0)
    if (data.salaryMin && data.salaryMin > 0) {
      cleanedFilters.salaryMin = data.salaryMin;
    }
    if (data.salaryMax && data.salaryMax > 0 && data.salaryMax < MAX_SALARY) {
      cleanedFilters.salaryMax = data.salaryMax;
    }
    
    // Experience Levels (array)
    if (data.experienceLevels && data.experienceLevels.length > 0) {
      cleanedFilters.experienceLevels = data.experienceLevels;
      console.log('[JobFilter] ✅ Experience levels in cleaned filters:', data.experienceLevels);
    } else {
      console.log('[JobFilter] ⚠️ No experience levels selected');
    }
    
    // Posted Within Days (only if > 0)
    if (data.postedWithinDays && data.postedWithinDays > 0) {
      cleanedFilters.postedWithinDays = data.postedWithinDays;
    }
    
    // AI Match Min (only if > 0)
    if (data.aiMatchMin && data.aiMatchMin > 0) {
      cleanedFilters.aiMatchMin = data.aiMatchMin;
    }
    
    console.log('[JobFilter] Cleaned filters to apply:', cleanedFilters);
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
    <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filters</h3>
        {hasActiveFilters && (
          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
            Active
          </span>
        )}
      </div>
      
      <form onSubmit={handleSubmit(onApplyFilters)} className="space-y-6">
        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Category
          </label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <CategoryDropdown
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="All Categories"
                searchable={true}
                allowClear={true}
              />
            )}
          />
        </div>

        {/* Job Type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                <span className="text-sm text-slate-600 dark:text-slate-300">{type}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value=""
                {...register('jobType')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">All Types</span>
            </label>
          </div>
        </div>

        {/* Remote Type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Work Location
          </label>
          <select
            {...register('remoteType')}
            className="app-select text-sm"
          >
            <option value="">All Locations</option>
            {REMOTE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Company Size */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Company Size
          </label>
          <select
            {...register('companySize')}
            className="app-select text-sm"
          >
            <option value="">Any Size</option>
            {COMPANY_SIZES.map((size) => (
              <option key={size} value={size}>{size} employees</option>
            ))}
          </select>
        </div>

        {/* Posted Within */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Posted Date
          </label>
          <select
            {...register('postedWithinDays', { valueAsNumber: true })}
            className="app-select text-sm"
          >
            {POSTED_WITHIN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value || ''}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Salary Range */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Salary Range
          </label>
          
          {/* Display selected values */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="font-medium text-indigo-600 dark:text-indigo-300">
              Min: {formatCurrencyNPR(salaryMin)}
            </span>
            <span className="font-medium text-indigo-600 dark:text-indigo-300">
              Max: {formatCurrencyNPR(salaryMax)}
            </span>
          </div>

          {/* Min Salary Slider */}
          <div className="mb-2">
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Minimum</label>
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
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600 dark:bg-slate-700"
              aria-label="Minimum salary"
            />
          </div>

          {/* Max Salary Slider */}
          <div className="mb-2">
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Maximum</label>
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
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600 dark:bg-slate-700"
              aria-label="Maximum salary"
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{formatCurrencyNPR(MIN_SALARY)}</span>
            <span>{formatCurrencyNPR(MAX_SALARY)}</span>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Location
          </label>
          <input
            type="text"
            placeholder="e.g., Kathmandu, Remote"
            {...register('location')}
            className="app-input text-sm"
          />
        </div>

        {/* Experience Level */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Experience Level
          </label>
          <div className="space-y-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <label key={level.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={experienceLevels.includes(level.value)}
                  onChange={() => handleExperienceLevelToggle(level.value)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">{level.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* AI Match Score Filter */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            AI Match Score (Minimum)
          </label>
          
          {/* Display current value */}
          <div className="text-center mb-2">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
              {aiMatchMin}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            {...register('aiMatchMin', { valueAsNumber: true })}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600 dark:bg-slate-700"
            aria-label="Minimum AI match score"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Clear All Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobFilter;
