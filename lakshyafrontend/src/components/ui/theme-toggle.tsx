import React from 'react';
import { useTheme } from '../../context/theme-context';

const ThemeToggle: React.FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-11 w-11 items-center justify-center border border-[#D1D5DB] bg-white text-slate-600 transition-colors duration-200 hover:border-[#2563EB] hover:text-[#2563EB] focus:outline-none focus:ring-0"
    >
      <span className="relative block h-5 w-5">
        <svg
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-75 opacity-0'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M21 12.79A9 9 0 1111.21 3c0 .34.02.67.05 1A7 7 0 0020 12c0 .27-.01.53-.04.79z"
          />
        </svg>
        <svg
          className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${
            isDark ? '-rotate-90 scale-75 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v2.25M12 18.75V21M4.97 4.97l1.59 1.59M17.44 17.44l1.59 1.59M3 12h2.25M18.75 12H21M4.97 19.03l1.59-1.59M17.44 6.56l1.59-1.59" />
          <circle cx="12" cy="12" r="4.25" strokeWidth={1.8} />
        </svg>
      </span>
    </button>
  );
};

export default ThemeToggle;
