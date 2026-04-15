import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, MenuItem, Grid, Card, CardContent,
  Typography, InputAdornment, Alert, Chip, Tooltip,
} from '@mui/material';
import { Search, CheckCircle, AccountBalance, HourglassEmpty, Star } from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import { useCommissions, useCommissionStats } from '../../hooks/useModules';
import { commissionsApi } from '../../api/index';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

function StatCard({ label, value, icon, color, loading, prefix = '' }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '11px', background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</Box>
        <Box>
          <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: KUKAT.navy, lineHeight: 1 }}>
            {loading ? '…' : `${prefix}${value}`}
          </Typography>
          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

const STATUS_FILTERS = ['', 'pending', 'approved', 'paid', 'cancelled'];

export default function CommissionsPage() {
  const navigate = useNavigate();
  const { canApprove, isAgent, user } = useAuth();
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [approving, setApproving] = useState(null);

  const filters = isAgent() ? { search, status, employeeID: user?.employeeID } : { search, status };
  const { commissions: rawCommissions, loading, error, total, refetch } = useCommissions(filters);
  const { stats: globalStats } = useCommissionStats();
  const commissions = rawCommissions ?? [];

  const totalEarned  = globalStats?.totalPaid    ?? 0;
  const totalPending = globalStats?.pending       ?? 0;
  const bonusCount   = globalStats?.bonusCount    ?? 0;

  const handleApprove = useCallback(async (id) => {
    setApproving(id);
    try {
      await commissionsApi.approve(id);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve commission.');
    } finally { setApproving(null); }
  }, [refetch]);

  const COLUMNS = [
    { id: 'commissionID',   label: 'ID',         minWidth: 70 },
    { id: 'agentName',      label: 'Agent',       minWidth: 160 },
    { id: 'bookingID',      label: 'Booking',     minWidth: 90,
      render: (v) => (
        <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, fontSize: '0.82rem' }}
          onClick={(e) => { e.stopPropagation(); navigate(`/bookings/${v}`); }}>
          #{v}
        </Button>
      )},
    { id: 'commissionRate',  label: 'Rate',        minWidth: 80, align: 'right',
      render: (v) => `${parseFloat(v || 0).toFixed(1)}%` },
    { id: 'commissionAmount',label: 'Amount',      minWidth: 120, align: 'right',
      render: (v) => (
        <Typography fontWeight={700} sx={{ color: KUKAT.navy, fontSize: '0.875rem' }}>
          ${parseFloat(v || 0).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
        </Typography>
      )},
    { id: 'isBonus',         label: '',            minWidth: 60, sortable: false,
      render: (v) => v ? (
        <Tooltip title="Bonus payment"><Star sx={{ fontSize: 16, color: KUKAT.amber }} /></Tooltip>
      ) : null },
    { id: 'status',          label: 'Status',      minWidth: 110, sortable: false,
      render: (v) => <StatusChip status={v} /> },
    { id: 'approvedAt',      label: 'Approved',    minWidth: 120,
      render: (v) => v ? new Date(v).toLocaleDateString('en-CA') : '—' },
    ...(canApprove() ? [{
      id: '_actions', label: '', minWidth: 120, sortable: false,
      render: (_, row) => row.status === 'pending' ? (
        <Button size="small" variant="outlined" color="success"
          disabled={approving === row.commissionID}
          onClick={(e) => { e.stopPropagation(); handleApprove(row.commissionID); }}
          startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
          sx={{ fontSize: '0.75rem', py: 0.3 }}>
          Approve
        </Button>
      ) : null,
    }] : []),
  ];

  return (
    <AppLayout title="Commissions" subtitle={`${total} commission record${total !== 1 ? 's' : ''}`}>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        <StatCard label="Total commissions" value={total}
          icon={<AccountBalance />} color={KUKAT.navy} loading={loading} />
        <StatCard label="Total paid out"
          value={totalEarned.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
          icon={<CheckCircle />} color="#15803D" loading={loading} prefix="$" />
        <StatCard label="Awaiting approval" value={totalPending}
          icon={<HourglassEmpty />} color={KUKAT.amber} loading={loading} />
        <StatCard label="Bonus payments" value={bonusCount}
          icon={<Star />} color="#7C3AED" loading={loading} />
      </Box>

      {/* ── Search + filters ─────────────────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
        gap: 1.5,
        alignItems: 'center',
        mb: 2.5,
      }}>
        <TextField placeholder="Search agent, booking…" size="small" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 18, color: KUKAT.textMuted }} />
            </InputAdornment>
          )}}
        />
        <TextField select size="small" label="Status" value={status}
          onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 150 }}>
          {STATUS_FILTERS.map(s => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
              {s || 'All statuses'}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={COLUMNS} rows={commissions} loading={loading}
        keyField="commissionID" emptyMessage="No commissions found."
        onRowClick={(row) => navigate(`/commissions/${row.commissionID}`)}
      />

    </AppLayout>
  );
}
