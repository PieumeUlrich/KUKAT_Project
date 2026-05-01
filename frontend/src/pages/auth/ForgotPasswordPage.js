import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Alert, CircularProgress, InputAdornment,
} from '@mui/material';
import { Email, ArrowBack, FlightTakeoff } from '@mui/icons-material';
import authApi from '../../api/authApi';
import { KUKAT } from '../../styles/theme';

export default function ForgotPasswordPage() {
  const navigate    = useNavigate();
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [sent,      setSent]      = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code.');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: KUKAT.surface, p: 3,
    }}>
      <Box sx={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, justifyContent: 'center' }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '10px',
            background: `linear-gradient(135deg, ${KUKAT.amber} 0%, ${KUKAT.amberDark} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FlightTakeoff sx={{ color: KUKAT.navy, fontSize: 20, transform: 'rotate(45deg)' }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.4rem', color: KUKAT.navy }}>
            KUKAT
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>

            {!sent ? (
              <>
                <Typography variant="h5" sx={{ color: KUKAT.navy, fontWeight: 700, mb: 0.5 }}>
                  Forgot your password?
                </Typography>
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, mb: 3 }}>
                  Enter your work email and we'll send you a 6-digit reset code.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    fullWidth label="Work email" type="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    disabled={loading} autoFocus
                    InputProps={{ startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ fontSize: 20, color: KUKAT.textMuted }} />
                      </InputAdornment>
                    )}}
                  />
                  <Button type="submit" variant="contained" fullWidth
                    disabled={loading} size="large">
                    {loading
                      ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                      : 'Send reset code'}
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Box sx={{
                  width: 56, height: 56, borderRadius: '14px',
                  background: '#DCFCE7', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', mb: 2,
                }}>
                  <Email sx={{ fontSize: 28, color: '#15803D' }} />
                </Box>
                <Typography variant="h5" sx={{ color: KUKAT.navy, fontWeight: 700, mb: 0.5 }}>
                  Check your email
                </Typography>
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, mb: 3 }}>
                  We sent a 6-digit reset code to <strong>{email}</strong>.
                  It expires in 15 minutes.
                </Typography>
                <Button variant="contained" fullWidth size="large"
                  onClick={() => navigate('/reset-password', { state: { email } })}>
                  Enter reset code →
                </Button>
              </>
            )}

            <Button startIcon={<ArrowBack />} fullWidth
              onClick={() => navigate('/login')}
              sx={{ mt: 2, color: KUKAT.textMuted }}>
              Back to sign in
            </Button>

          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}