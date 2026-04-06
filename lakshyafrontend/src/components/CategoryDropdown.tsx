import React, { useState, useRef, useEffect } from 'react';
import { JOB_CATEGORIES, getCategoryMeta } from '../constants/jobCategories';

interface CategoryDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
  error?: string;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Select category',
  searchable = true,
  disabled = false,
  className = '',
  allowClear = true,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = searchTerm
    ? JOB_CATEGORIES.filter(cat =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : JOB_CATEGORIES;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const selectedMeta = value ? getCategoryMeta(value) : null;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex w-full items-center justify-between border bg-white px-4 py-2.5 text-left transition-colors dark:bg-slate-900 ${
          disabled
            ? 'cursor-not-allowed bg-slate-50 opacity-60 dark:bg-slate-800'
            : 'hover:border-[#2563EB] focus:border-[#2563EB] focus:ring-0'
        } ${
          error ? 'border-red-300 dark:border-red-500/40' : 'border-[#D1D5DB] dark:border-slate-700'
        } ${isOpen ? 'border-[#2563EB]' : ''}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {value && selectedMeta ? (
            <>
              <span className="flex-shrink-0 text-lg">{selectedMeta.icon}</span>
              <span className="truncate text-[14px] text-[#111827] dark:text-slate-100">{value}</span>
            </>
          ) : (
            <span className="text-[14px] text-[#6B7280] dark:text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="ml-2 flex flex-shrink-0 items-center gap-1">
          {value && allowClear && !disabled && (
            <span
              role="button"
              onClick={handleClear}
              className="cursor-pointer p-0.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Clear selection"
            >
              <svg className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform dark:text-slate-500 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {error && (
        <p className="mt-1 text-[13px] text-red-600">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden border border-[#E5E7EB] bg-white dark:border-slate-700 dark:bg-slate-900">
          {searchable && (
            <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] p-2 dark:border-slate-800 dark:bg-slate-950">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full border border-[#D1D5DB] bg-white py-2 pl-9 pr-3 text-[14px] text-[#111827] outline-none focus:border-[#2563EB] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              <div className="py-1">
                {filteredCategories.map((category) => {
                  const meta = getCategoryMeta(category);
                  const isSelected = value === category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleSelect(category)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-[#111827] hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex-shrink-0 text-lg">{meta.icon}</span>
                      <span className="flex-1 truncate text-[14px] font-medium">{category}</span>
                      {isSelected && (
                        <svg className="h-5 w-5 flex-shrink-0 text-[#2563EB] dark:text-indigo-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-[13px] text-[#6B7280] dark:text-slate-400">
                No categories found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;
