import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import { Lock, Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import AppLayout from '../../components/layout/AppLayout';
import authApi from '../../api/authApi';
import { KUKAT } from '../../styles/theme';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const [errors,      setErrors]      = useState({});

  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setErrors(p => ({ ...p, [f]: '' }));
    setError('');
    setSuccess(false);
  };

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Required';
    if (!form.newPassword)     e.newPassword     = 'Required';
    if (form.newPassword.length < 8) e.newPassword = 'Minimum 8 characters';
    if (form.newPassword !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError(''); setSuccess(false);
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally { setLoading(false); }
  };

  return (
    <AppLayout title="Change password" subtitle="Update your account password">
      <Box sx={{ maxWidth: 480 }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '10px',
                background: `${KUKAT.navy}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lock sx={{ color: KUKAT.navy, fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: KUKAT.navy, lineHeight: 1 }}>
                  Change password
                </Typography>
                <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                  Choose a strong password of at least 8 characters
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
            )}
            {success && (
              <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                Password changed successfully.
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth label="Current password"
                type={showCurrent ? 'text' : 'password'}
                value={form.currentPassword} onChange={set('currentPassword')}
                error={!!errors.currentPassword} helperText={errors.currentPassword}
                sx={{ mb: 2.5 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCurrent(p => !p)} edge="end" size="small">
                        {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth label="New password"
                type={showNew ? 'text' : 'password'}
                value={form.newPassword} onChange={set('newPassword')}
                error={!!errors.newPassword} helperText={errors.newPassword || 'Minimum 8 characters'}
                sx={{ mb: 2.5 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNew(p => !p)} edge="end" size="small">
                        {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth label="Confirm new password"
                type="password"
                value={form.confirmPassword} onChange={set('confirmPassword')}
                error={!!errors.confirmPassword} helperText={errors.confirmPassword}
                sx={{ mb: 3 }}
              />

              <Button type="submit" variant="contained" fullWidth
                disabled={loading} size="large">
                {loading
                  ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                  : 'Update password'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}