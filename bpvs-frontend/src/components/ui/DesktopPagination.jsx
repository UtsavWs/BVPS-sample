import { ChevronLeft, ChevronRight } from "lucide-react";

const DesktopPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  startIndex,
  itemsPerPage = 10,
  label = "items",
}) => {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages || totalPages === 0;

  const getPageNumbers = () => {
    if (totalPages <= 5)
      return Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, currentPage]);
    if (currentPage > 1) pages.add(currentPage - 1);
    if (currentPage < totalPages) pages.add(currentPage + 1);
    return Array.from(pages).sort((a, b) => a - b);
  };

  const pageNumbers = getPageNumbers();
  const btnBase =
    "h-8 min-w-[32px] px-2 rounded-lg border text-[13px] font-medium transition-colors flex items-center justify-center";
  const btnActive = "bg-[#C94621] text-white border-[#C94621]";
  const btnNormal =
    "bg-white text-stone-600 border-stone-200 hover:border-[#C94621] hover:text-[#C94621]";
  const btnDisabled =
    "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed";
  const endItem = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-stone-100 bg-white">
      <p className="text-[13px] text-stone-400">
        Showing{" "}
        <span className="font-semibold text-gray-700">
          {totalItems === 0 ? 0 : startIndex + 1}–
          {totalItems === 0 ? 0 : endItem}
        </span>{" "}
        of <span className="font-semibold text-gray-700">{totalItems}</span>{" "}
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => !isFirstPage && onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className={`${btnBase} gap-1 px-3 ${isFirstPage ? btnDisabled : btnNormal}`}
        >
          <ChevronLeft size={13} />
          <span>Prev</span>
        </button>
        {pageNumbers.map((page, idx) => {
          const prevPage = pageNumbers[idx - 1];
          const showEllipsis = prevPage && page - prevPage > 1;
          return (
            <div key={page} className="flex items-center gap-1.5">
              {showEllipsis && (
                <span className="text-stone-400 text-[13px] px-1">...</span>
              )}
              <button
                onClick={() => onPageChange(page)}
                disabled={totalPages === 0}
                className={`${btnBase} ${totalPages === 0 ? btnDisabled : page === currentPage ? btnActive : btnNormal}`}
              >
                {page}
              </button>
            </div>
          );
        })}
        <button
          onClick={() => !isLastPage && onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className={`${btnBase} gap-1 px-3 ${isLastPage ? btnDisabled : btnNormal}`}
        >
          <span>Next</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default DesktopPagination;
