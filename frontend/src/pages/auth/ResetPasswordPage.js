import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import {
  Lock, Visibility, VisibilityOff,
  CheckCircle, FlightTakeoff, ArrowBack,
} from '@mui/icons-material';
import authApi from '../../api/authApi';
import { KUKAT } from '../../styles/theme';

export default function ResetPasswordPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const emailFromState = location.state?.email || '';

  const [form, setForm] = useState({
    email:       emailFromState,
    otp:         '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [errors,    setErrors]    = useState({});
  const [success,   setSuccess]   = useState(false);

  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setErrors(p => ({ ...p, [f]: '' }));
    setError('');
  };

  const validate = () => {
    const e = {};
    if (!form.email)       e.email       = 'Required';
    if (!form.otp || form.otp.length !== 6) e.otp = 'Enter the 6-digit code';
    if (!form.newPassword) e.newPassword = 'Required';
    if (form.newPassword.length < 8) e.newPassword = 'Minimum 8 characters';
    if (form.newPassword !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError('');
    try {
      await authApi.resetPassword(form.email, form.otp, form.newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
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

            {!success ? (
              <>
                <Typography variant="h5" sx={{ color: KUKAT.navy, fontWeight: 700, mb: 0.5 }}>
                  Reset your password
                </Typography>
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, mb: 3 }}>
                  Enter the 6-digit code from your email and choose a new password.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                  {/* Email — pre-filled if came from forgot page */}
                  <TextField fullWidth label="Work email" type="email"
                    value={form.email} onChange={set('email')}
                    error={!!errors.email} helperText={errors.email}
                    disabled={!!emailFromState}
                  />

                  {/* OTP */}
                  <TextField fullWidth label="6-digit reset code"
                    value={form.otp} onChange={set('otp')}
                    error={!!errors.otp} helperText={errors.otp}
                    inputProps={{ maxLength: 6 }}
                    sx={{
                      '& input': {
                        fontSize: '1.4rem', fontWeight: 700,
                        letterSpacing: '0.3em', textAlign: 'center',
                        fontFamily: 'monospace',
                      }
                    }}
                  />

                  {/* New password */}
                  <TextField fullWidth label="New password"
                    type={showPass ? 'text' : 'password'}
                    value={form.newPassword} onChange={set('newPassword')}
                    error={!!errors.newPassword}
                    helperText={errors.newPassword || 'Minimum 8 characters'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ fontSize: 20, color: KUKAT.textMuted }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPass(p => !p)} edge="end" size="small">
                            {showPass
                              ? <VisibilityOff fontSize="small" />
                              : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Confirm password */}
                  <TextField fullWidth label="Confirm new password"
                    type="password"
                    value={form.confirmPassword} onChange={set('confirmPassword')}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                  />

                  <Button type="submit" variant="contained" fullWidth
                    disabled={loading} size="large">
                    {loading
                      ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                      : 'Reset password'}
                  </Button>

                </Box>
              </>
            ) : (
              /* Success state */
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{
                  width: 64, height: 64, borderRadius: '16px',
                  background: '#DCFCE7', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  mx: 'auto', mb: 2,
                }}>
                  <CheckCircle sx={{ fontSize: 36, color: '#15803D' }} />
                </Box>
                <Typography variant="h5" sx={{ color: KUKAT.navy, fontWeight: 700, mb: 1 }}>
                  Password reset!
                </Typography>
                <Typography variant="body2" sx={{ color: KUKAT.textMuted, mb: 3 }}>
                  Your password has been updated successfully.
                  You can now sign in with your new password.
                </Typography>
                <Button variant="contained" fullWidth size="large"
                  onClick={() => navigate('/login')}>
                  Back to sign in
                </Button>
              </Box>
            )}

            {!success && (
              <Button startIcon={<ArrowBack />} fullWidth
                onClick={() => navigate('/forgot-password')}
                sx={{ mt: 2, color: KUKAT.textMuted }}>
                Back — resend code
              </Button>
            )}

          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}