import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, TableSortLabel, Paper,
  Box, Skeleton, Typography,
} from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';
import { KUKAT } from '../../styles/theme';

export default function DataTable({
  columns,        // [{ id, label, minWidth, align, render }]
  rows,           // array of data objects
  loading = false,
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 10,
  onRowClick,     // optional — (row) => void
  keyField = 'id',
  emptyMessage = 'No records found.',
}) {
  const [page, setPage]           = useState(0);
  const [rowsPerPage, setRPP]     = useState(defaultRowsPerPage);
  const [orderBy, setOrderBy]     = useState('');
  const [order, setOrder]         = useState('asc');

  const handleSort = (colId) => {
    const isAsc = orderBy === colId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(colId);
    setPage(0);
  };

  const sorted = [...rows].sort((a, b) => {
    if (!orderBy) return 0;
    const va = a[orderBy] ?? '';
    const vb = b[orderBy] ?? '';
    if (va < vb) return order === 'asc' ? -1 : 1;
    if (va > vb) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ borderRadius: '12px', border: `1px solid ${KUKAT.border}`, overflow: 'hidden', boxShadow: 1 }}>
      <TableContainer>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || 'left'}
                  style={{ minWidth: col.minWidth }}
                  sortDirection={orderBy === col.id ? order : false}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton variant="text" width="80%" height={20} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <InboxOutlined sx={{ fontSize: 40, color: KUKAT.border, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow
                  key={row[keyField]}
                  onClick={() => onRowClick?.(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&:hover': { backgroundColor: onRowClick ? `${KUKAT.surfaceAlt}` : undefined },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} align={col.align || 'left'}>
                      {col.render ? col.render(row[col.id], row) : row[col.id] ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRPP(+e.target.value); setPage(0); }}
        sx={{ borderTop: `1px solid ${KUKAT.border}` }}
      />
    </Paper>
  );
}
