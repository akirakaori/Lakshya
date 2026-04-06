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
      <label htmlFor="page-size" className="text-[13px] font-medium text-[#4B5563] dark:text-slate-400">
        Show
      </label>
      <select
        id="page-size"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="border border-[#D1D5DB] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[13px] text-[#374151] dark:text-slate-300 focus:border-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-[13px] text-[#4B5563] dark:text-slate-400">per page</span>
    </div>
  );
};
