import { useState } from "react";
import DataTable from "../components/DataTable";

export default function QueryLab() {
  const [query, setQuery] = useState("SELECT TOP 10 * FROM ULRICH.CUSTOMER");
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  const runQuery = (e) => {
    e.preventDefault();
    setError("");

    fetch("http://localhost:3001/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    })
      .then((res) => res.json())
      .then((result) => setData(result.recordset || []))
      .catch(() => setError("Error running query"));
  };

  return (
    <div>
      <h1>Query Lab</h1>

      <form className="form-vertical" onSubmit={runQuery}>
        <label>SQL Query</label>
        <textarea rows={5} value={query} onChange={(e) => setQuery(e.target.value)} />
        <button type="submit">Run Query</button>
      </form>

      {error && <p className="status-error">{error}</p>}

      <h2 className="section-title">Results</h2>
      <DataTable data={data} />
    </div>
  );
}