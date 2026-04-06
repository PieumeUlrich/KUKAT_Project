import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LockOutlined } from '@mui/icons-material';
import { KUKAT } from '../../styles/theme';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: KUKAT.surface, gap: 2,
    }}>
      <Box sx={{
        width: 64, height: 64, borderRadius: '16px',
        background: '#FEE2E2', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <LockOutlined sx={{ fontSize: 32, color: '#DC2626' }} />
      </Box>
      <Typography variant="h4" sx={{ color: KUKAT.navy, fontFamily: '"Playfair Display", serif' }}>
        Access denied
      </Typography>
      <Typography variant="body2" sx={{ color: KUKAT.textMuted, textAlign: 'center', maxWidth: 360 }}>
        You don't have permission to view this page. Contact your administrator if you think this is a mistake.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        Back to dashboard
      </Button>
    </Box>
  );
}
