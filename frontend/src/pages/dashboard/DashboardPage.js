import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import {
  BookOnline, People, Receipt, AccountBalance,
} from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

const STAT_CARDS = [
  { label: 'Total Bookings',   icon: <BookOnline />,      color: KUKAT.navy,     value: '—' },
  { label: 'Customers',        icon: <People />,           color: KUKAT.teal,     value: '—' },
  { label: 'Invoices Pending', icon: <Receipt />,          color: KUKAT.amber,    value: '—' },
  { label: 'Commissions Due',  icon: <AccountBalance />,   color: '#8B5CF6',      value: '—' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout
      title="Dashboard"
      subtitle={`Good day, ${user?.firstName} — here's your overview`}
    >
      <Grid container spacing={2.5}>
        {STAT_CARDS.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '12px',
                  background: `${card.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.color, flexShrink: 0,
                }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ color: KUKAT.navy, lineHeight: 1 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                    {card.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, p: 4, borderRadius: 3, background: '#fff',
        border: `1px solid ${KUKAT.border}`, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ color: KUKAT.navy, mb: 1 }}>
          Dashboard in progress
        </Typography>
        <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
          Charts, KPIs and activity feeds will be wired here once each module is built.
        </Typography>
      </Box>
    </AppLayout>
  );
}
