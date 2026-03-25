import React from 'react';

interface PageSizeSelectProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
  disabled?: boolean;
}

export const PageSizeSelect: React.FC<PageSizeSelectProps> = ({
  value,
  onChange,
  options = [5, 10, 20],
  disabled = false
}) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="page-size" className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Show
      </label>
      <select
        id="page-size"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-sm text-slate-700 dark:text-slate-300">per page</span>
    </div>
  );
};
