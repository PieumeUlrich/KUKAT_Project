import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField,
  MenuItem, Chip, Alert,
} from '@mui/material';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import api from '../../api/client';
import { KUKAT } from '../../styles/theme';

const ACTION_COLORS = {
  CREATE:          { bg: '#DCFCE7', color: '#15803D' },
  UPDATE:          { bg: '#DBEAFE', color: '#1D4ED8' },
  DELETE:          { bg: '#FEE2E2', color: '#DC2626' },
  LOGIN:           { bg: '#F3E8FF', color: '#7C3AED' },
  LOGOUT:          { bg: '#F1F5F9', color: '#475569' },
  CONFIRM:         { bg: '#CCFBF1', color: '#0F766E' },
  CANCEL:          { bg: '#FEE2E2', color: '#DC2626' },
  APPROVE:         { bg: '#DCFCE7', color: '#15803D' },
  MARK_PAID:       { bg: '#DCFCE7', color: '#15803D' },
  ADD_PAYMENT:     { bg: '#FEF9C3', color: '#854D0E' },
  CHANGE_PASSWORD: { bg: '#FEE2E2', color: '#DC2626' },
  REASSIGN:        { bg: '#DBEAFE', color: '#1D4ED8' },
  ACTIVATE:        { bg: '#DCFCE7', color: '#15803D' },
  DEACTIVATE:      { bg: '#FEE2E2', color: '#DC2626' },
};

const COLUMNS = [
  { id: 'auditID',      label: 'ID',        minWidth: 60 },
  { id: 'createdAt',    label: 'Timestamp', minWidth: 160,
    render: (v) => v ? new Date(v).toLocaleString('en-CA') : '—' },
  { id: 'employeeName', label: 'User',      minWidth: 140 },
  { id: 'action',       label: 'Action',    minWidth: 120,
    render: (v) => {
      const cfg = ACTION_COLORS[v] || { bg: '#F1F5F9', color: '#475569' };
      return (
        <Chip label={v} size="small" sx={{
          fontSize: '0.7rem', height: 20, borderRadius: '4px',
          background: cfg.bg, color: cfg.color, fontWeight: 600,
        }} />
      );
    }},
  { id: 'tableName',    label: 'Table',     minWidth: 120 },
  { id: 'recordID',     label: 'Record ID', minWidth: 90 },
  { id: 'ipAddress',    label: 'IP',        minWidth: 120 },
];

export default function AuditPage() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [action,  setAction]  = useState('');
  const [table,   setTable]   = useState('');

const fetch = useCallback(async () => {
  setLoading(true); setError(null);
  try {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    if (table)  params.append('tableName', table);
    const { data } = await api.get(`/audit?${params}`);
    setLogs(Array.isArray(data) ? data : []);
  } catch (e) {
    setError(e.response?.data?.message || 'Failed to load audit logs.');
  } finally { setLoading(false); }
}, [action, table]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <AppLayout title="Audit log" subtitle="Track all system changes and user actions">

      {/* ── Filters ──────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1.5, mb: 3,
      }}>
        <TextField select size="small" label="Action" value={action}
          onChange={(e) => setAction(e.target.value)}>
          <MenuItem value="">All actions</MenuItem>
          {Object.keys(ACTION_COLORS).map(a => (
            <MenuItem key={a} value={a}>{a}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Table" value={table}
          onChange={(e) => setTable(e.target.value)}>
          <MenuItem value="">All tables</MenuItem>
          {['bookings','customers','employees','invoices','payments',
            'commissions','commission_payments'].map(t => (
            <MenuItem key={t} value={t}>{t}</MenuItem>
          ))}
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={COLUMNS}
        rows={logs}
        loading={loading}
        keyField="auditID"
        emptyMessage="No audit logs found."
      />

    </AppLayout>
  );
}