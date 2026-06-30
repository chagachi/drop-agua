import './Pagination.css'

interface PaginationProps {
  page: number
  lastPage: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, lastPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null

  const start = Math.max(1, page - 2)
  const end = Math.min(lastPage, page + 2)
  const pages = []
  for (let p = start; p <= end; p++) pages.push(p)

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        «
      </button>
      {start > 1 && <span className="pagination__ellipsis">...</span>}
      {pages.map((p) => (
        <button
          key={p}
          className={p === page ? 'pagination__current' : ''}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      {end < lastPage && <span className="pagination__ellipsis">...</span>}
      <button disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
        »
      </button>
    </div>
  )
}
