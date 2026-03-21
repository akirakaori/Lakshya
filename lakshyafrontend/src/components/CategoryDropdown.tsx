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

  // Filter categories based on search
  const filteredCategories = searchTerm
    ? JOB_CATEGORIES.filter(cat =>
        cat.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : JOB_CATEGORIES;

  // Close dropdown when clicking outside
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

  // Focus search input when dropdown opens
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
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between rounded-lg border bg-white px-4 py-2.5 text-left transition-all dark:bg-slate-900 ${
          disabled
            ? 'cursor-not-allowed bg-slate-50 opacity-60 dark:bg-slate-950'
            : 'hover:border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500'
        } ${
          error ? 'border-red-300 dark:border-red-500/40' : 'border-slate-300 dark:border-slate-700'
        } ${isOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {value && selectedMeta ? (
            <>
              <span className="text-lg flex-shrink-0">{selectedMeta.icon}</span>
              <span className="truncate text-sm text-slate-900 dark:text-slate-100">{value}</span>
            </>
          ) : (
            <span className="text-sm text-slate-500 dark:text-slate-400">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {value && allowClear && !disabled && (
            <span
              role="button"
              onClick={handleClear}
              className="cursor-pointer rounded p-0.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
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
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {/* Search Input */}
          {searchable && (
            <div className="border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
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
                  className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Category List */}
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
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-200'
                          : 'text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{meta.icon}</span>
                      <span className="flex-1 text-sm font-medium truncate">{category}</span>
                      {isSelected && (
                        <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
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
