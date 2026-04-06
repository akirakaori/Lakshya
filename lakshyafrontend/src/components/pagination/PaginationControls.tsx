import React from 'react';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  onPageChange,
  isLoading = false,
  isFetching = false
}) => {
  const { page, limit, total, pages } = pagination;

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPageNumbers = (): (number | string)[] => {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }

    const pageNumbers: (number | string)[] = [1];

    if (page <= 3) {
      pageNumbers.push(2, 3, 4, '...', pages);
    } else if (page >= pages - 2) {
      pageNumbers.push('...', pages - 3, pages - 2, pages - 1, pages);
    } else {
      pageNumbers.push('...', page - 1, page, page + 1, '...', pages);
    }

    return pageNumbers;
  };

  if (pages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 py-4 sm:flex-row">
      <div className="text-[13px] text-[#4B5563] dark:text-slate-400">
        {isFetching ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin text-[#2563EB]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Updating...
          </span>
        ) : (
          <>
            Showing <span className="font-semibold">{startItem}</span> to <span className="font-semibold">{endItem}</span> of{' '}
            <span className="font-semibold">{total}</span> results
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || isLoading}
          className="border border-[#D1D5DB] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[13px] font-medium text-[#374151] dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-slate-900"
        >
          Previous
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {getPageNumbers().map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-[13px] text-[#6B7280] dark:text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                disabled={isLoading}
                className={`border px-3 py-2 text-[13px] font-medium transition-colors ${
                  page === pageNum
                    ? 'border-[#2563EB] bg-[#2563EB] text-white'
                    : 'border-[#D1D5DB] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#374151] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'
                }`}
              >
                {pageNum}
              </button>
            )
          ))}
        </div>

        <div className="text-[13px] font-medium text-[#4B5563] sm:hidden">
          Page {page} of {pages}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages || isLoading}
          className="border border-[#D1D5DB] dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[13px] font-medium text-[#374151] dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-slate-900"
        >
          Next
        </button>
      </div>
    </div>
  );
};
