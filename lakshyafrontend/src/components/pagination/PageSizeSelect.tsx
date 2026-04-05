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
      <label htmlFor="page-size" className="text-[13px] font-medium text-[#4B5563]">
        Show
      </label>
      <select
        id="page-size"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="border border-[#D1D5DB] bg-white px-3 py-2 text-[13px] text-[#374151] focus:border-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-[13px] text-[#4B5563]">per page</span>
    </div>
  );
};
