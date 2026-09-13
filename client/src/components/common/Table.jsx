// Generic table: columns = [{ key, label, render? }], rows = array of data.
// `render(row)` lets a column show custom content (badges, buttons)
// instead of raw field values. Handles overflow so it stays usable on
// small screens per the responsive-design requirement.
const Table = ({ columns, rows, rowKey = '_id', emptyMessage = 'No records found' }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((col) => (
            <th key={col.key} className="whitespace-nowrap px-4 py-3 text-left font-medium text-gray-500">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row[rowKey]} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-gray-700">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default Table;
