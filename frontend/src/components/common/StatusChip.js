import React from 'react';
import { Chip } from '@mui/material';

// No duplicate keys — each status maps to exactly one style
const STATUS_MAP = {
  // Booking
  pending:   { label: 'Pending',   bg: '#FEF9C3', color: '#854D0E' },
  confirmed: { label: 'Confirmed', bg: '#DCFCE7', color: '#15803D' },
  completed: { label: 'Completed', bg: '#E0F2FE', color: '#0369A1' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#DC2626' },
  // Invoice
  unpaid:    { label: 'Unpaid',    bg: '#FEF9C3', color: '#854D0E' },
  partial:   { label: 'Partial',   bg: '#FEF3C7', color: '#92400E' },
  paid:      { label: 'Paid',      bg: '#DCFCE7', color: '#15803D' },
  refunded:  { label: 'Refunded',  bg: '#F3E8FF', color: '#7E22CE' },
  // Commission
  approved:  { label: 'Approved',  bg: '#CCFBF1', color: '#0F766E' },
  // Payment / share
  failed:    { label: 'Failed',    bg: '#FEE2E2', color: '#DC2626' },
  deposit:   { label: 'Deposit',   bg: '#E0F2FE', color: '#0369A1' },
  full:      { label: 'Full',      bg: '#DCFCE7', color: '#15803D' },
  // Generic
  active:    { label: 'Active',    bg: '#DCFCE7', color: '#15803D' },
  inactive:  { label: 'Inactive',  bg: '#FEE2E2', color: '#DC2626' },
};

export default function StatusChip({ status, size = 'small' }) {
  const key = status?.toLowerCase?.() ?? '';
  const cfg = STATUS_MAP[key] ?? { label: status ?? '—', bg: '#F1F5F9', color: '#475569' };
  return (
    <Chip
      label={cfg.label}
      size={size}
      sx={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.72rem' : '0.8rem',
        height: size === 'small' ? 22 : 26,
        borderRadius: '6px',
        '& .MuiChip-label': { px: 1.2 },
      }}
    />
  );
}
