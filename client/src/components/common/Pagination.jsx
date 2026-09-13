import { ChevronLeft, ChevronRight } from 'lucide-react';

// Simple prev/next + page-count pagination, driven entirely by props
// so it works with any list (courses, students, assignments...) that
// returns { page, pages, total } from the backend.
const Pagination = ({ page, pages, total, onPageChange }) => {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm text-gray-500">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
