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
    console.log('[JobFilter] Experience level toggled:', level);
    console.log('[JobFilter] Updated experienceLevels:', updated);
  };

  const onApplyFilters = (data: JobFilters) => {
    console.log('[JobFilter] Applying filters - RAW data:', data);

    const cleanedFilters: JobFilters = {};

    if (data.keyword && data.keyword.trim()) {
      cleanedFilters.keyword = data.keyword.trim();
    }

    if (data.category && data.category.trim()) {
      const trimmedCategory = data.category.trim();
      cleanedFilters.category = trimmedCategory;
      console.log('[JobFilter] Category filter selected:');
      console.log('  - Original:', data.category);
      console.log('  - Trimmed:', trimmedCategory);
      console.log('  - Length:', trimmedCategory.length);
      console.log('  - Char codes:', Array.from(trimmedCategory).map((c, i) => `[${i}]='${c}'(${c.charCodeAt(0)})`));
    }

    if (data.location && data.location.trim()) {
      cleanedFilters.location = data.location.trim();
    }

    if (data.jobType && data.jobType.trim()) {
      cleanedFilters.jobType = data.jobType.trim();
    }

    if (data.remoteType && data.remoteType.trim()) {
      cleanedFilters.remoteType = data.remoteType.trim();
    }

    if (data.companySize && data.companySize.trim()) {
      cleanedFilters.companySize = data.companySize.trim();
    }

    if (data.salaryMin && data.salaryMin > 0) {
      cleanedFilters.salaryMin = data.salaryMin;
    }
    if (data.salaryMax && data.salaryMax > 0 && data.salaryMax < MAX_SALARY) {
      cleanedFilters.salaryMax = data.salaryMax;
    }

    if (data.experienceLevels && data.experienceLevels.length > 0) {
      cleanedFilters.experienceLevels = data.experienceLevels;
      console.log('[JobFilter] Experience levels in cleaned filters:', data.experienceLevels);
    } else {
      console.log('[JobFilter] No experience levels selected');
    }

    if (data.postedWithinDays && data.postedWithinDays > 0) {
      cleanedFilters.postedWithinDays = data.postedWithinDays;
    }

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
    <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-slate-900 dark:text-slate-100">Filters</h3>
        {hasActiveFilters && (
          <span className="border border-blue-200 bg-blue-50 px-2 py-1 text-[12px] font-medium text-[#2563EB]">
            Active
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onApplyFilters)} className="space-y-5">
        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-900 dark:text-slate-100">
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

        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-900 dark:text-slate-100">
            Job Type
          </label>
          <div className="space-y-2">
            {JOB_TYPES.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  value={type}
                  {...register('jobType')}
                  className="h-4 w-4 border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-[14px] font-normal text-slate-600 dark:text-slate-300">{type}</span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                value=""
                {...register('jobType')}
                className="h-4 w-4 border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span className="text-[14px] font-normal text-slate-600 dark:text-slate-300">All Types</span>
            </label>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-900 dark:text-slate-100">
            Work Location
          </label>
          <select
            {...register('remoteType')}
            className="w-full border border-[#D1D5DB] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[14px] text-[#374151] dark:text-slate-100 outline-none focus:border-[#2563EB]"
          >
            <option value="">All Locations</option>
            {REMOTE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-900 dark:text-slate-100">
            Company Size
          </label>
          <select
            {...register('companySize')}
            className="w-full border border-[#D1D5DB] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[14px] text-[#374151] dark:text-slate-100 outline-none focus:border-[#2563EB]"
          >
            <option value="">Any Size</option>
            {COMPANY_SIZES.map((size) => (
              <option key={size} value={size}>{size} employees</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-900 dark:text-slate-100">
            Posted Date
          </label>
          <select
            {...register('postedWithinDays', { valueAsNumber: true })}
            className="w-full border border-[#D1D5DB] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[14px] text-[#374151] dark:text-slate-100 outline-none focus:border-[#2563EB]"
          >
            {POSTED_WITHIN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value || ''}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-900 dark:text-slate-100">
            Salary Range
          </label>

          <div className="mb-3 flex items-center justify-between text-[13px]">
            <span className="font-medium text-[#2563EB]">
              Min: {formatCurrencyNPR(salaryMin)}
            </span>
            <span className="font-medium text-[#2563EB]">
              Max: {formatCurrencyNPR(salaryMax)}
            </span>
          </div>

          <div className="mb-2">
            <label className="mb-1 block text-[12px] font-normal text-[#6B7280] dark:text-slate-400">Minimum</label>
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
              className="h-2 w-full cursor-pointer appearance-none bg-slate-200 accent-[#2563EB] dark:bg-slate-700"
              aria-label="Minimum salary"
            />
          </div>

          <div className="mb-2">
            <label className="mb-1 block text-[12px] font-normal text-[#6B7280] dark:text-slate-400">Maximum</label>
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
              className="h-2 w-full cursor-pointer appearance-none bg-slate-200 accent-[#2563EB] dark:bg-slate-700"
              aria-label="Maximum salary"
            />
          </div>

          <div className="flex justify-between text-[12px] font-normal text-[#6B7280] dark:text-slate-400">
            <span>{formatCurrencyNPR(MIN_SALARY)}</span>
            <span>{formatCurrencyNPR(MAX_SALARY)}</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-900 dark:text-slate-100">
            Location
          </label>
          <input
            type="text"
            placeholder="e.g., Kathmandu, Remote"
            {...register('location')}
            className="w-full border border-[#D1D5DB] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[14px] text-[#111827] dark:text-slate-100 outline-none placeholder:text-[#6B7280] dark:placeholder:text-slate-500 focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-900 dark:text-slate-100">
            Experience Level
          </label>
          <div className="space-y-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <label key={level.value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={experienceLevels.includes(level.value)}
                  onChange={() => handleExperienceLevelToggle(level.value)}
                  className="h-4 w-4 border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-[14px] font-normal text-slate-600 dark:text-slate-300">{level.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-900 dark:text-slate-100">
            AI Match Score (Minimum)
          </label>

          <div className="mb-2 text-center">
            <span className="text-2xl font-bold text-[#2563EB]">
              {aiMatchMin}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            {...register('aiMatchMin', { valueAsNumber: true })}
            className="h-2 w-full cursor-pointer appearance-none bg-slate-200 accent-[#2563EB] dark:bg-slate-700"
            aria-label="Minimum AI match score"
          />
          <div className="mt-1 flex justify-between text-[12px] font-normal text-[#6B7280] dark:text-slate-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="space-y-2 border-t border-[#E5E7EB] dark:border-slate-800 pt-4">
          <button
            type="submit"
            className="w-full border border-[#2563EB] bg-[#2563EB] px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-blue-700"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="w-full border border-[#2563EB] bg-white dark:bg-slate-900 px-4 py-2.5 text-[14px] font-medium text-[#2563EB] dark:text-indigo-300 transition-colors hover:bg-blue-50 dark:hover:bg-indigo-500/10"
          >
            Clear All Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobFilter;
