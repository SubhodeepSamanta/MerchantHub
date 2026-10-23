export default function DataTable({
  columns = [],
  data = [],
  onRowClick,
  keyExtractor = (item, idx) => item.id || idx,
  emptyMessage = 'No data available'
}) {
  return (
    <div className="border border-line rounded-md bg-surface overflow-hidden overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-canvas border-b border-line h-9">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 text-[11px] font-medium uppercase tracking-wider text-muted ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                } ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-[13px] text-ink">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={keyExtractor(row, rowIdx)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`h-11 border-b border-line last:border-b-0 hover:bg-canvas transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-2 ${
                      col.align === 'right' ? 'text-right font-mono tabular-nums' : 'text-left'
                    } ${col.cellClassName || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
