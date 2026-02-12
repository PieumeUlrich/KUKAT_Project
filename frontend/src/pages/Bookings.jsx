import { useEffect, useState } from "react";
import DataTable from "../components/DataTable";

export default function Bookings() {
  const [destinations, setDestinations] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState("");
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/booking/destination")
      .then((res) => res.json())
      .then((data) => setDestinations(data || []));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch(`http://localhost:3001/api/booking?destinationId=${selectedDestination}`)
      .then((res) => res.json())
      .then((data) => setBookings(data.recordset || []));
  };

  return (
    <div>
      <h1>Bookings</h1>

      <form className="form-inline" onSubmit={handleSubmit}>
        <label>Destination:</label>
        <select
          value={selectedDestination}
          onChange={(e) => setSelectedDestination(e.target.value)}
        >
          <option value="">-- Select --</option>
          {destinations.map((d) => (
            <option key={d.DESTINATIONID} value={d.DESTINATIONID}>
              {d.DESTDESCRIPTION}
            </option>
          ))}
        </select>

        <button type="submit">Load Bookings</button>
      </form>

      <h2 className="section-title">Results</h2>
      <DataTable data={bookings} />
    </div>
  );
}