const exportToCsv = (filename, rows, columns) => {
  if (!rows || rows.length === 0) return;

  // Build header row
  const headers = columns.map(c => `"${c.label}"`).join(',');

  // Build data rows
  const data = rows.map(row =>
    columns.map(col => {
      let val = row[col.id] ?? '';
      // Strip HTML if any
      if (typeof val === 'string') val = val.replace(/<[^>]*>/g, '');
      // Escape quotes
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );

  const csv = [headers, ...data].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export default exportToCsv;