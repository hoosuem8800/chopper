import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationGlassProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * PaginationGlass - A reusable glassmorphism pagination component
 * 
 * This component implements the pagination-Glass styling and can be used
 * throughout the application for consistent styling.
 * 
 * @param currentPage - The current active page
 * @param totalPages - Total number of pages
 * @param onPageChange - Function called when page changes
 * @param className - Optional additional classes
 */
const PaginationGlass: React.FC<PaginationGlassProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className = ""
}) => {
  return (
    <div className={`mt-8 mb-10 flex justify-center ${className}`}>
      <div className="relative" 
        style={{ 
          width: (() => {
            // Determine width based on number of pages
            if (totalPages <= 1) return '240px';
            if (totalPages === 2) return '300px';  
            if (totalPages === 3) return '360px';
            if (totalPages === 4) return '420px';
            return totalPages <= 5 ? '480px' : '520px'; // 5+ pages
          })(),
          maxWidth: '95vw'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/20 to-blue-100/20 rounded-[22px] blur-xl -z-10 transform scale-105 opacity-60"></div>
        <Pagination className="pagination-Glass p-3 px-4 rounded-2xl w-full">
          <PaginationContent className="pagination-content flex justify-center">
            <PaginationItem className="pagination-item">
              <PaginationPrevious 
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                aria-disabled={currentPage === 1}
                className={`pagination-prev ${currentPage === 1 ? "pointer-events-none opacity-50" : ""} transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:scale-105 hover:shadow-md`}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              // Logic to display the correct page numbers
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={pageNum} className="pagination-item">
                  <PaginationLink 
                    onClick={() => onPageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className={`pagination-link ${currentPage === pageNum 
                      ? "active bg-cyan-500/80 backdrop-blur-md text-white dark:bg-cyan-600/80 hover:bg-cyan-600/90 dark:hover:bg-cyan-500/90 shadow-lg" 
                      : "hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all duration-300 hover:scale-110"
                    }`}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PaginationItem className="pagination-item">
                <PaginationEllipsis className="pagination-link backdrop-blur-sm hover:bg-white/30 dark:hover:bg-slate-800/30 transition-all duration-300" />
              </PaginationItem>
            )}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PaginationItem className="pagination-item">
                <PaginationLink 
                  onClick={() => onPageChange(totalPages)}
                  className="pagination-link hover:bg-white/60 dark:hover:bg-slate-800/50 transition-all duration-300 hover:scale-110"
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}
            
            <PaginationItem className="pagination-item">
              <PaginationNext 
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                aria-disabled={currentPage === totalPages}
                className={`pagination-next ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""} transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:scale-105 hover:shadow-md`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default PaginationGlass; 