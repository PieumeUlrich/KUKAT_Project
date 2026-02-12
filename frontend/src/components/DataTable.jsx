import { useState } from "react";

export default function DataTable({ data }) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <p>No data available</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  // Pagination calculations
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const currentRows = data.slice(startIndex, startIndex + rowsPerPage);

  const nextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  return (
    <div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col.replace(/([A-Z])/g, " $1")}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {currentRows.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col}>{row[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      <div className="pagination">
        <button onClick={prevPage} disabled={page === 1}>
          Previous
        </button>

        <span className="page-info">
          Page {page} of {totalPages}
        </span>

        <button onClick={nextPage} disabled={page === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}