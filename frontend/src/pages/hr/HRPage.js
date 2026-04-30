import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  TextField, MenuItem, Alert, Avatar, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import { useCustomers } from '../../hooks/useModules';
import { customersApi, staffApi } from '../../api/index';
import { KUKAT } from '../../styles/theme';

const COLUMNS = [
  { id: 'customerID',   label: 'ID',            minWidth: 60 },
  { id: 'name',         label: 'Customer',      minWidth: 180,
    render: (_, r) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <Avatar sx={{
          width: 28, height: 28, fontSize: '0.75rem',
          fontWeight: 700, background: KUKAT.teal, color: '#fff',
        }}>
          {r.firstName?.[0]}{r.lastName?.[0]}
        </Avatar>
        <Typography variant="body2" fontWeight={600}>
          {r.firstName} {r.lastName}
        </Typography>
      </Box>
    )},
  { id: 'agentName',    label: 'Current agent', minWidth: 160 },
  { id: 'city',         label: 'City',          minWidth: 110 },
  { id: 'bookingCount', label: 'Bookings',       minWidth: 90, align: 'center' },
];

export default function HRPage() {
  const [agents,       setAgents]      = useState([]);
  const [allCustomers, setAllCustomers] = useState([]); // ← all customers for workload stats
  const [filterAgent,  setFilterAgent] = useState('');
  const [selected,     setSelected]    = useState([]);
  const [newAgent,     setNewAgent]    = useState('');
  const [dialogOpen,   setDialogOpen]  = useState(false);
  const [saving,       setSaving]      = useState(false);
  const [saveErr,      setSaveErr]     = useState('');
  const [success,      setSuccess]     = useState('');

  // Filtered customers for the table
  const { customers: rawCustomers, loading, error, refetch } = useCustomers({
    agentID: filterAgent || undefined,
    limit: 'all',
  });
  const customers = rawCustomers ?? [];

  // Load agents
  useEffect(() => {
    staffApi.getAll({ role: 'agent', limit: 'all' })
      .then(({ data }) => {
        const list = data.employees ?? data.data ?? data;
        setAgents(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  // Load ALL customers (unfiltered) for workload card counts
  useEffect(() => {
    customersApi.getAll({ limit: 'all' })
      .then(({ data }) => {
        const list = data.customers ?? data.data ?? data;
        setAllCustomers(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, []);

  // Agent workload stats — always uses allCustomers, never filtered
  const agentStats = agents.map(a => ({
    ...a,
    customerCount: allCustomers.filter(
      c => c.assignedAgentID === a.employeeID
    ).length,
  })).sort((a, b) => b.customerCount - a.customerCount);

  const handleBulkReassign = useCallback(async () => {
    if (!newAgent || selected.length === 0) return;
    setSaving(true); setSaveErr(''); setSuccess('');
    try {
      // ← Pass agentID as object — matches customersApi.reassign(id, { agentID })
      await Promise.all(
        selected.map(id => customersApi.reassign(id, { agentID: newAgent }))
      );
      setSuccess(
        `${selected.length} customer${selected.length > 1 ? 's' : ''} reassigned successfully.`
      );
      setSelected([]);
      setDialogOpen(false);
      setNewAgent('');
      refetch();
      // Refresh allCustomers so workload cards update
      customersApi.getAll({ limit: 'all' })
        .then(({ data }) => {
          const list = data.customers ?? data.data ?? data;
          setAllCustomers(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    } catch (err) {
      setSaveErr(err.response?.data?.message || 'Reassignment failed.');
    } finally { setSaving(false); }
  }, [selected, newAgent, refetch]);

  const selectedAgent = agents.find(a => a.employeeID === filterAgent);

  return (
    <AppLayout
      title="HR — Client management"
      subtitle="Manage agent assignments and workloads">

      {/* ── Agent workload cards ──────────────────────────────── */}
      <Typography variant="h6" sx={{ color: KUKAT.navy, mb: 2 }}>
        Agent workloads
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
        gap: 2, mb: 3,
      }}>
        {agentStats.slice(0, 6).map(a => (
          <Card key={a.employeeID}
            sx={{
              cursor: 'pointer',
              border: filterAgent === a.employeeID
                ? `2px solid ${KUKAT.amber}`
                : `1px solid ${KUKAT.border}`,
              transition: 'border 0.15s',
            }}
            onClick={() =>
              setFilterAgent(prev => prev === a.employeeID ? '' : a.employeeID)
            }>
            <CardContent sx={{
              display: 'flex', alignItems: 'center',
              gap: 2, p: '14px !important',
            }}>
              <Avatar sx={{
                width: 38, height: 38, fontSize: '0.85rem',
                fontWeight: 700, background: KUKAT.navy, color: '#fff',
              }}>
                {a.firstName?.[0]}{a.lastName?.[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600} sx={{ color: KUKAT.navy }}>
                  {a.firstName} {a.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                  {a.agentCode}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{
                  fontSize: '1.3rem', fontWeight: 700,
                  color: KUKAT.teal, lineHeight: 1,
                }}>
                  {a.customerCount}
                </Typography>
                <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                  clients
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* ── Customer table header ─────────────────────────────── */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5, mb: 2,
      }}>
        <Box>
          <Typography variant="h6" sx={{ color: KUKAT.navy }}>
            {filterAgent && selectedAgent
              ? `Customers — ${selectedAgent.firstName} ${selectedAgent.lastName}`
              : 'All customers'}
          </Typography>
          {filterAgent && (
            <Button size="small" onClick={() => setFilterAgent('')} sx={{ px: 0 }}>
              Clear filter
            </Button>
          )}
        </Box>
        {selected.length > 0 && (
          <Button variant="contained" startIcon={<SwapHoriz />}
            onClick={() => { setSaveErr(''); setDialogOpen(true); }}
            sx={{ background: KUKAT.teal, alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
            Reassign {selected.length} selected
          </Button>
        )}
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={COLUMNS}
        rows={customers}
        loading={loading}
        keyField="customerID"
        emptyMessage="No customers match this filter."
        onRowClick={(row) => {
          setSelected(prev =>
            prev.includes(row.customerID)
              ? prev.filter(id => id !== row.customerID)
              : [...prev, row.customerID]
          );
        }}
      />

      {selected.length > 0 && (
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
            {selected.length} customer{selected.length > 1 ? 's' : ''} selected
          </Typography>
          <Button size="small" onClick={() => setSelected([])} sx={{ px: 0 }}>
            Clear selection
          </Button>
        </Box>
      )}

      {/* ── Reassign dialog ────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)}
        maxWidth="xs" fullWidth>
        <DialogTitle>
          Reassign {selected.length} customer{selected.length > 1 ? 's' : ''}
        </DialogTitle>
        <DialogContent>
          {saveErr && <Alert severity="error" sx={{ mb: 2 }}>{saveErr}</Alert>}
          <Typography variant="body2" sx={{ color: KUKAT.textMuted, mb: 2 }}>
            Select the agent to assign these customers to.
          </Typography>
          <TextField select fullWidth label="New agent"
            value={newAgent} onChange={(e) => setNewAgent(e.target.value)}>
            {agents.map(a => (
              <MenuItem key={a.employeeID} value={a.employeeID}>
                {a.firstName} {a.lastName} ({a.agentCode})
                {' — '}
                {agentStats.find(s => s.employeeID === a.employeeID)?.customerCount ?? 0} clients
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleBulkReassign}
            disabled={!newAgent || saving}>
            {saving
              ? <CircularProgress size={18} sx={{ color: '#fff' }} />
              : 'Reassign'}
          </Button>
        </DialogActions>
      </Dialog>

    </AppLayout>
  );
}