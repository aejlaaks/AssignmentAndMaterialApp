import React from 'react';
import './Pagination.css';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className = '',
}) => {
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  const generatePagination = () => {
    // If there are less than 7 pages, show all pages
    if (totalPages <= 7) {
      return range(1, totalPages);
    }

    // Calculate left and right sibling indexes
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // Should show dots on left side
    const shouldShowLeftDots = leftSiblingIndex > 2;
    // Should show dots on right side
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Case 1: Show right dots only
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, 'dots', totalPages];
    }

    // Case 2: Show left dots only
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [1, 'dots', ...rightRange];
    }

    // Case 3: Show both left and right dots
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, 'dots', ...middleRange, 'dots', totalPages];
    }

    return [];
  };

  const pages = generatePagination();

  if (totalPages <= 1) return null;

  return (
    <nav className={`pagination ${className}`} aria-label="Pagination">
      <ul className="pagination-list">
        <li className="pagination-item">
          <button
            className="pagination-button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            &laquo;
          </button>
        </li>
        {pages.map((page, index) => {
          if (page === 'dots') {
            return (
              <li key={`dots-${index}`} className="pagination-item pagination-dots">
                &hellip;
              </li>
            );
          }

          return (
            <li key={page} className="pagination-item">
              <button
                className={`pagination-button ${
                  currentPage === page ? 'pagination-button-active' : ''
                }`}
                onClick={() => onPageChange(page as number)}
                aria-current={currentPage === page ? 'page' : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </button>
            </li>
          );
        })}
        <li className="pagination-item">
          <button
            className="pagination-button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination; 