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

  // Calculate displayed range
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate smart page numbers (max 7 buttons)
  const getPageNumbers = (): (number | string)[] => {
    if (pages <= 7) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }

    const pageNumbers: (number | string)[] = [1];

    if (page <= 3) {
      // Near start: [1] 2 3 4 ... pages
      pageNumbers.push(2, 3, 4, '...', pages);
    } else if (page >= pages - 2) {
      // Near end: 1 ... (pages-3) (pages-2) (pages-1) [pages]
      pageNumbers.push('...', pages - 3, pages - 2, pages - 1, pages);
    } else {
      // Middle: 1 ... (page-1) [page] (page+1) ... pages
      pageNumbers.push('...', page - 1, page, page + 1, '...', pages);
    }

    return pageNumbers;
  };

  if (pages <= 1) {
    return null; // Don't show pagination if only 1 page
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t bg-gray-50">
      {/* Showing X-Y of total */}
      <div className="text-sm text-gray-700">
        {isFetching ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

      {/* Pagination buttons */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || isLoading}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        >
          Previous
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                disabled={isLoading}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  page === pageNum
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {pageNum}
              </button>
            )
          ))}
        </div>

        {/* Mobile page indicator */}
        <div className="sm:hidden text-sm text-gray-700 font-medium">
          Page {page} of {pages}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages || isLoading}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};
