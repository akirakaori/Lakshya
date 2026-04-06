import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`animate-spin border-2 border-[#E5E7EB] dark:border-slate-700 border-t-[#2563EB] ${sizeClasses[size]}`}></div>
      {text && <p className="mt-4 text-[14px] text-[#6B7280] dark:text-slate-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
