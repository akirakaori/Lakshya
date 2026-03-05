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
  options = [5, 10, 15, 20],
  disabled = false
}) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="page-size" className="text-sm text-gray-700 font-medium">
        Show
      </label>
      <select
        id="page-size"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-700">per page</span>
    </div>
  );
};
