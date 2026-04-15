import React, { useState } from 'react';
import { Box, Grid, TextField, Button, Divider, Typography, CircularProgress } from '@mui/material';
import { KUKAT } from '../../styles/theme';

const EMPTY = {
  firstName: '', lastName: '', email: '', homePhone: '', businessPhone: '',
  birthDate: '', address: '', city: '', postalCode: '', province: '', country: 'Canada', notes: '',
};

export default function CustomerForm({ initial = {}, onSave, onCancel, saving }) {
  const [form,   setForm]   = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});

  const set = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); setErrors(p => ({ ...p, [f]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSave(form); };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* ── Personal info ─────────────────────────────────── */}
      <Typography variant="h6" sx={{ color: KUKAT.navy }}>Personal info</Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="First name *" value={form.firstName} onChange={set('firstName')}
          error={!!errors.firstName} helperText={errors.firstName} />
        <TextField fullWidth label="Last name *" value={form.lastName} onChange={set('lastName')}
          error={!!errors.lastName} helperText={errors.lastName} />
      </Box>

      <TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} />

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="Home phone" value={form.homePhone} onChange={set('homePhone')} />
        <TextField fullWidth label="Business phone" value={form.businessPhone} onChange={set('businessPhone')} />
      </Box>

      <TextField fullWidth label="Date of birth" type="date" value={form.birthDate} onChange={set('birthDate')}
        InputLabelProps={{ shrink: true }} />

      {/* ── Address ───────────────────────────────────────── */}
      <Divider><Typography variant="caption">Address</Typography></Divider>

      <TextField fullWidth label="Street address" value={form.address} onChange={set('address')} />

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="City"     value={form.city}     onChange={set('city')} />
        <TextField fullWidth label="Province" value={form.province} onChange={set('province')} />
        <TextField fullWidth label="Postal code" value={form.postalCode} onChange={set('postalCode')} />
        <TextField fullWidth label="Country"     value={form.country}    onChange={set('country')} />
      </Box>

      <TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={set('notes')} />

      {/* ── Actions ───────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', gap: 2, justifyContent: 'flex-end',
        mt: 2, pt: 3, borderTop: `1px solid ${KUKAT.border}`,
      }}>
        <Button variant="outlined" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ minWidth: 130 }}>
          {saving
            ? <CircularProgress size={20} sx={{ color: '#fff' }} />
            : initial.customerID ? 'Save changes' : 'Create customer'}
        </Button>
      </Box>

    </Box>  );
}
