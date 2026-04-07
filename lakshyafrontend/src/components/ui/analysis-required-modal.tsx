import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AnalysisRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onAnalyze: () => void;
  title?: string;
  description?: string;
  isOutdated?: boolean;
}

const AnalysisRequiredModal: React.FC<AnalysisRequiredModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onAnalyze,
  title = 'Resume Analysis Required',
  description = 'You need to analyze your resume before applying to this job. This helps match your skills with job requirements.',
  isOutdated = false,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const modalContent = (
    <div
      className="app-modal-overlay animate-fadeIn"
      onClick={handleOverlayClick}
    >
      <div className="app-modal-panel max-w-lg transform animate-slideUp rounded-xl border border-slate-200 bg-white p-6 shadow-xl transition-all dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5 flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L2.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {isOutdated ? 'Resume Analysis Outdated' : title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {isOutdated
                ? 'Your profile changed after the last analysis. Re-analyze first so your job match score is accurate before applying.'
                : description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            onClick={onAnalyze}
            className="inline-flex items-center justify-center rounded-lg border border-[#2563EB] bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-md"
          >
            Analyze Now
          </button>
        </div>

        <button
          onClick={onConfirm}
          className="mt-3 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Continue anyway
        </button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modalContent;
  return createPortal(modalContent, document.body);
};

export default AnalysisRequiredModal;
