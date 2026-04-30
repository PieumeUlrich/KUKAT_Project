import React, { useState, useEffect } from 'react';
import {
  Box, TextField, MenuItem, Button, CircularProgress,
  Switch, FormControlLabel, Typography,
} from '@mui/material';
import { packagesApi } from '../../api/index';
import { suppliersApi } from '../../api/index'; // ← now uses suppliers endpoint
import { KUKAT } from '../../styles/theme';

const EMPTY = {
  supplierID: '', categoryID: '', productName: '',
  description: '', isActive: true,
};

export function PackageForm({ initial = {}, onSave, onCancel, saving }) {
  const [form,       setForm]       = useState({ ...EMPTY, ...initial });
  const [suppliers,  setSuppliers]  = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors,     setErrors]     = useState({});

  useEffect(() => {
    // ← Now uses suppliersApi which hits the new /api/suppliers endpoint
    suppliersApi.getAll({ isActive: true, limit: 'all' })
      .then(({ data }) => setSuppliers(data.data ?? data))
      .catch(() => {});
    packagesApi.getCategories()
      .then(({ data }) => setCategories(data.categories ?? data))
      .catch(() => {});
  }, []);

  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setErrors(p => ({ ...p, [f]: '' }));
  };

  // Show commission rate when supplier is selected
  const selectedSupplier = suppliers.find(
    s => s.supplierID === parseInt(form.supplierID)
  );

  const validate = () => {
    const e = {};
    if (!form.productName.trim()) e.productName = 'Required';
    if (!form.supplierID)         e.supplierID  = 'Required';
    if (!form.categoryID)         e.categoryID  = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      <TextField fullWidth label="Package name *" value={form.productName}
        onChange={set('productName')}
        error={!!errors.productName} helperText={errors.productName} />

      <TextField select fullWidth label="Supplier *" value={form.supplierID}
        onChange={set('supplierID')}
        error={!!errors.supplierID} helperText={errors.supplierID}>
        {suppliers.map(s => (
          <MenuItem key={s.supplierID} value={s.supplierID}>
            {s.supplierName}
          </MenuItem>
        ))}
      </TextField>

      {/* Show supplier commission rate once selected — read only info */}
      {selectedSupplier && (
        <Box sx={{
          p: 1.5, borderRadius: 1,
          background: '#F0FDF4', border: '1px solid #DCFCE7',
        }}>
          <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 600 }}>
            Commission rate for this supplier: {parseFloat(selectedSupplier.commissionRate || 0).toFixed(1)}%
          </Typography>
          <Typography variant="caption" sx={{ color: KUKAT.textMuted, display: 'block' }}>
            This is what the agency earns per booking with {selectedSupplier.supplierName}
          </Typography>
        </Box>
      )}

      <TextField select fullWidth label="Category *" value={form.categoryID}
        onChange={set('categoryID')}
        error={!!errors.categoryID} helperText={errors.categoryID}>
        {categories.map(c => (
          <MenuItem key={c.categoryID} value={c.categoryID}>
            {c.categoryName}
          </MenuItem>
        ))}
      </TextField>

      <TextField fullWidth label="Description" multiline rows={3}
        value={form.description} onChange={set('description')} />

      <FormControlLabel
        control={
          <Switch checked={!!form.isActive}
            onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))} />
        }
        label="Active (visible to agents)"
      />

      <Box sx={{
        display: 'flex', gap: 2, justifyContent: 'flex-end',
        mt: 1, pt: 3, borderTop: `1px solid ${KUKAT.border}`,
      }}>
        <Button variant="outlined" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" disabled={saving}
          onClick={() => { if (validate()) onSave(form); }}>
          {saving
            ? <CircularProgress size={20} sx={{ color: '#fff' }} />
            : initial?.productID ? 'Save changes' : 'Create'}
        </Button>
      </Box>

    </Box>
  );
}

export default PackageForm;