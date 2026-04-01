import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'error' | 'warning' | 'success' | 'info';
  closeText?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'error',
  closeText = 'Close',
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent background scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Variant styles
  const variantStyles = {
    error: {
      icon: 'text-red-600 dark:text-red-400',
      header: 'bg-red-50 border-b border-red-200 dark:bg-red-500/10 dark:border-red-500/20',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'text-yellow-600 dark:text-yellow-400',
      header: 'bg-yellow-50 border-b border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    success: {
      icon: 'text-green-600 dark:text-green-400',
      header: 'bg-green-50 border-b border-green-200 dark:bg-green-500/10 dark:border-green-500/20',
      button: 'bg-green-600 hover:bg-green-700 text-white',
    },
    info: {
      icon: 'text-blue-600 dark:text-blue-400',
      header: 'bg-blue-50 border-b border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const styles = variantStyles[variant];

  const icons = {
    error: (
      <svg className={`w-6 h-6 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-10V5a2 2 0 112 2h.01a2 2 0 11-2-2zm0 0h.01" />
      </svg>
    ),
    warning: (
      <svg className={`w-6 h-6 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className={`w-6 h-6 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className={`w-6 h-6 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const modalContent = (
    <div
      className="app-modal-overlay animate-fadeIn"
      onClick={handleOverlayClick}
    >
      <div className="app-modal-panel max-w-md transform animate-slideUp transition-all">
        {/* Header */}
        <div className={`px-6 py-4 ${styles.header}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icons[variant]}
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              type="button"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="leading-relaxed text-slate-700 dark:text-slate-300">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end rounded-b-xl bg-slate-50 px-6 py-4 dark:bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${styles.button}`}
          >
            {closeText}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modalContent;
  return createPortal(modalContent, document.body);
};

export default AlertModal;
