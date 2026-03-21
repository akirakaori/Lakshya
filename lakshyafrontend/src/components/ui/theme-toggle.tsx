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
      className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-400/60 dark:hover:text-indigo-300"
    >
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 transition-all duration-300 group-hover:from-indigo-500/10 group-hover:via-sky-500/10 group-hover:to-cyan-500/10" />
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
