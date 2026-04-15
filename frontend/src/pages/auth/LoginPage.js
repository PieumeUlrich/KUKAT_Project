import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility, VisibilityOff,
  FlightTakeoff as FlightIcon,
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

// ── Role badge colours (used in the visual panel) ─────────────
const ROLE_BADGES = [
  { label: 'Super Admin',  color: '#E0F2FE', text: '#0369A1' },
  { label: 'Manager',      color: '#F3E8FF', text: '#7E22CE' },
  { label: 'Agent',        color: '#DCFCE7', text: '#15803D' },
  { label: 'Accountant',   color: '#FEF9C3', text: '#854D0E' },
  { label: 'HR',           color: '#FFE4E6', text: '#9F1239' },
];

export default function LoginPage() {
  const navigate        = useNavigate();
  const location        = useLocation();
  const { login }       = useAuth();
  const from            = location.state?.from?.pathname || '/dashboard';

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: '"DM Sans", sans-serif',
    }}>

      {/* ── Left panel: branding ────────────────────────────── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '48%',
        background: `linear-gradient(160deg, ${KUKAT.navyLight} 0%, ${KUKAT.navyDark} 100%)`,
        p: '52px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Decorative circles */}
        <Box sx={{
          position: 'absolute', top: -80, right: -80,
          width: 320, height: 320, borderRadius: '50%',
          border: `1px solid rgba(255,255,255,0.07)`,
        }} />
        <Box sx={{
          position: 'absolute', top: 60, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          border: `1px solid rgba(255,255,255,0.05)`,
        }} />
        <Box sx={{
          position: 'absolute', bottom: -100, left: -60,
          width: 400, height: 400, borderRadius: '50%',
          border: `1px solid rgba(245,158,11,0.12)`,
        }} />
        <Box sx={{
          position: 'absolute', bottom: 80, left: -20,
          width: 240, height: 240, borderRadius: '50%',
          background: 'rgba(245,158,11,0.04)',
        }} />

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 1 }}>
          <Box sx={{
            width: 42, height: 42, borderRadius: '10px',
            background: `linear-gradient(135deg, ${KUKAT.amber} 0%, ${KUKAT.amberDark} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FlightIcon sx={{ color: KUKAT.navy, fontSize: 22, transform: 'rotate(45deg)' }} />
          </Box>
          <Typography sx={{ color: 'rgba(245, 233, 183, 0.61)',
            fontSize: '1.9rem', fontWeight: 800, mt: 1.5, mb: 1.5, lineHeight: 1.3 }}>
            KUKAT
          </Typography>
        </Box>

        {/* Headline */}
        <Box sx={{ zIndex: 1 }}>
          <Typography sx={{
            color: '#fff', fontWeight: 500,
            fontSize: 'clamp(1.9rem, 5vw, 2.9rem)',
            lineHeight: 1.4, mb: 2,
          }}>
            Your agency,<br />
            <Box component="span" sx={{ color: KUKAT.amberLight }}>fully in control.</Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 380 }}>
            Manage bookings, customers, commissions and your entire team from a single, powerful platform.
          </Typography>

          {/* Role badges */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 4 }}>
            {ROLE_BADGES.map((b) => (
              <Box key={b.label} sx={{
                px: 1.5, py: 0.5, borderRadius: '20px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', fontWeight: 500 }}>
                  {b.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', zIndex: 1 }}>
          © {new Date().getFullYear()} KUKAT Travel Agency · Calgary, AB
        </Typography>
      </Box>

      {/* ── Right panel: form ───────────────────────────────── */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 3, sm: 6 },
        background: KUKAT.surface,
      }}>

        {/* Mobile logo */}
        <Box sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center', gap: 1.5, mb: 4,
        }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: '9px',
            background: `linear-gradient(135deg, ${KUKAT.amber} 0%, ${KUKAT.amberDark} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FlightIcon sx={{ color: KUKAT.navy, fontSize: 20, transform: 'rotate(45deg)' }} />
          </Box>
          <Typography sx={{
            fontWeight: 700, fontSize: '1.4rem', color: KUKAT.navy,
          }}>
            KUKAT
          </Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 700,
            color: KUKAT.navy, mb: 0.5,
          }}>
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: KUKAT.textMuted, mb: 4, textAlign: 'center'}}>
            Sign in to your KUKAT workspace
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              autoFocus
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ fontSize: 22, color: KUKAT.textMuted }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Password"
              type={showPass ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              sx={{ mb: 3.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ fontSize: 22, color: KUKAT.textMuted }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small">
                      {showPass
                        ? <VisibilityOff sx={{ fontSize: 22 }} />
                        : <Visibility  sx={{ fontSize: 22 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              size="large"
              sx={{
                py: 1.5,
                fontSize: '1rem',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${KUKAT.navyLight} 0%, ${KUKAT.navyDark} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${KUKAT.navy} 0%, ${KUKAT.navyDark} 100%)`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 8px 20px rgba(11,43,64,0.3)`,
                },
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign in'}
            </Button>
          </Box>

          <Typography variant="caption" sx={{
            display: 'block', textAlign: 'center', mt: 4,
            color: KUKAT.textMuted, fontSize: '0.85rem',
          }}>
            Having trouble signing in? Contact your system administrator.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
