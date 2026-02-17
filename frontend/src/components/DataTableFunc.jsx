import { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function DataTableFunc({ data, onEdit, onDelete }) {
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

  // Pagination
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const currentRows = data.slice(startIndex, startIndex + rowsPerPage);

  const nextPage = () => page < totalPages && setPage(page + 1);
  const prevPage = () => page > 1 && setPage(page - 1);

  return (
    <div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                col === "BIRTHDATE" || col === "CUSTOMERID" ? ( null
                ) : (
                <th key={col}>{col.replace(/([A-Z])/g, "$1")}</th>
                )
              ))}
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {currentRows.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  col === "BIRTHDATE" || col === "CUSTOMERID" ? ( null
                  ) : (
                  <td key={col}>{row[col]}</td>
                  )
                ))}

                {/* ACTION BUTTONS */}
                <td className="action-cell">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => onEdit(row)}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="action-btn delete-btn"
                    onClick={() => onDelete(row)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
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