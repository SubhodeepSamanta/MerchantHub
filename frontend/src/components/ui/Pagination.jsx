import Button from './Button'

export default function Pagination({
  page = 0,
  size = 20,
  totalElements = 0,
  totalPages = 1,
  onPageChange
}) {
  const from = totalElements === 0 ? 0 : page * size + 1
  const to = Math.min((page + 1) * size, totalElements)
  const hasPrev = page > 0
  const hasNext = page < totalPages - 1 && to < totalElements

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-[13px] text-muted">
        {totalElements === 0
          ? 'No results'
          : `Showing ${from}–${to} of ${totalElements}`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
