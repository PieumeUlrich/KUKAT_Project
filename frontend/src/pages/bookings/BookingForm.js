import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, TextField, MenuItem, Button, Typography,
  Divider, Autocomplete, CircularProgress,
  InputAdornment, IconButton, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, Alert, Tooltip,
} from '@mui/material';
import { Add, Delete, Group, ShoppingCart } from '@mui/icons-material';
import { useBookingFormData } from '../../hooks/useBookings';
import { bookingsApi } from '../../api/index';
import { useAuth } from '../../store/AuthContext';
import { KUKAT } from '../../styles/theme';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const toDateInput = (val) => {
  if (!val) return '';
  try { return new Date(val).toISOString().slice(0, 10); }
  catch { return ''; }
};

const fmt = (n) =>
  n != null
    ? `$${parseFloat(n).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`
    : '—';

// ── Empty item template ───────────────────────────────────────
const emptyItem = () => ({
  _key:         Math.random().toString(36).slice(2), // local key for React
  productID:    '',
  description:  '',
  unitPrice:    '',
  quantity:     1,
  tripStart:    '',
  tripEnd:      '',
  classTypeID:  '',
  destinationID:'',
  notes:        '',
  // populated after product select:
  productName:  '',
  supplierName: '',
  commissionRate: '',
});

export default function BookingForm({ initial = {}, onSave, onCancel, saving }) {
  const { user } = useAuth();
  const isEdit   = !!initial?.bookingID;

  const {
    destinations, classTypes, fees, products, loading: refLoading,
  } = useBookingFormData();

  // ── Booking header ────────────────────────────────────────
  const [form, setForm] = useState({
    bookingDate: toDateInput(initial?.bookingDate),
    taxRate:     initial?.taxRate     ?? 5,
    status:      initial?.status      ?? 'pending',
    notes:       initial?.notes       ?? '',
  });

  // ── Items ─────────────────────────────────────────────────
  const [items, setItems] = useState(() => {
    if (initial?.items?.length) {
      return initial.items.map(item => ({
        _key:          Math.random().toString(36).slice(2),
        productID:     item.productID     || '',
        description:   item.description   || '',
        unitPrice:     item.unitPrice     || '',
        quantity:      item.quantity      || 1,
        tripStart:     toDateInput(item.tripStart),
        tripEnd:       toDateInput(item.tripEnd),
        classTypeID:   item.classTypeID   || '',
        destinationID: item.destinationID || '',
        notes:         item.notes         || '',
        productName:   item.productName   || '',
        supplierName:  item.supplierName  || '',
        commissionRate: item.supplierCommissionRate || '',
      }));
    }
    return [emptyItem()];
  });

  // ── Lead customer ─────────────────────────────────────────
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerQuery,    setCustomerQuery]    = useState('');
  const [customers,        setCustomers]        = useState([]);
  const [custLoading,      setCustLoading]      = useState(false);
  const preloaded = useRef(false);

  // Search customers as user types
  useEffect(() => {
    if (!customerQuery || customerQuery.length < 2) {
      if (!selectedCustomer) setCustomers([]);
      return;
    }
    setCustLoading(true);
    bookingsApi.getCustomers({ search: customerQuery })
      .then(({ data }) => {
        const list = data.customers ?? data.data ?? data;
        setCustomers(Array.isArray(list) ? list : []);
      })
      .catch(() => {})
      .finally(() => setCustLoading(false));
  }, [customerQuery]);

  // Pre-load existing customer when editing
  useEffect(() => {
    if (!initial?.members?.length || preloaded.current) return;
    preloaded.current = true;
    const lead = initial.members.find(m => m.role === 'lead');
    if (lead) {
      const customer = {
        customerID: lead.customerID,
        firstName:  lead.firstName,
        lastName:   lead.lastName,
        email:      lead.email || '',
      };
      setSelectedCustomer(customer);
      // ← Add to customers array so Autocomplete can display it
      setCustomers([customer]);
    }
  }, [initial?.members]);

  // ── Group members (non-lead) ──────────────────────────────
  const [members,       setMembers]       = useState(() =>
    (initial?.members ?? []).filter(m => m.role !== 'lead')
  );
  const [memberQuery,   setMemberQuery]   = useState('');
  const [memberOptions, setMemberOptions] = useState([]);

  useEffect(() => {
    if (!memberQuery || memberQuery.length < 2) { setMemberOptions([]); return; }
    bookingsApi.getCustomers({ search: memberQuery })
      .then(({ data }) => {
        const list = data.customers ?? data.data ?? data;
        setMemberOptions(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [memberQuery]);

  // ── Errors ────────────────────────────────────────────────
  const [errors, setErrors] = useState({});

  // ── Derived totals ────────────────────────────────────────
  const itemsTotal = items.reduce(
    (sum, item) =>
      sum + (parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 1)),
    0
  );
  const taxAmount  = itemsTotal * (parseFloat(form.taxRate || 0) / 100);
  const grandTotal = itemsTotal + taxAmount;

  // ── Item helpers ──────────────────────────────────────────
  const setItem = (key, field) => (e) => {
    setItems(prev => prev.map(item =>
      item._key === key ? { ...item, [field]: e.target.value } : item
    ));
  };

  const setItemValue = (key, field, value) => {
    setItems(prev => prev.map(item =>
      item._key === key ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  const removeItem = (key) => {
    if (items.length === 1) return; // keep at least one item
    setItems(prev => prev.filter(item => item._key !== key));
  };

  const handleProductSelect = (key, productID) => {
    const product = products.find(p => p.productID === productID);
    setItems(prev => prev.map(item =>
      item._key === key ? {
        ...item,
        productID,
        productName:   product?.productName   || '',
        supplierName:  product?.supplierName  || '',
        commissionRate: product?.commissionRate || '',
      } : item
    ));
  };

  // ── Member helpers ────────────────────────────────────────
  const addMember = useCallback((customer) => {
    if (!customer) return;
    if (customer.customerID === selectedCustomer?.customerID) return;
    if (members.find(m => m.customerID === customer.customerID)) return;
    setMembers(prev => [...prev, {
      customerID:  customer.customerID,
      firstName:   customer.firstName,
      lastName:    customer.lastName,
      email:       customer.email || '',
      shareAmount: '',
      sharePaid:   0,
      shareStatus: 'unpaid',
    }]);
    setMemberQuery('');
    setMemberOptions([]);
  }, [members, selectedCustomer]);

  const removeMember = (customerID) =>
    setMembers(prev => prev.filter(m => m.customerID !== customerID));

  // ── Validation ────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!selectedCustomer) e.customerID = 'Lead customer is required.';
    if (!form.bookingDate) e.bookingDate = 'Booking date is required.';
    items.forEach((item, i) => {
      if (!item.productID) e[`item_${i}_product`] = 'Product required.';
      if (!item.unitPrice || isNaN(parseFloat(item.unitPrice))) {
        e[`item_${i}_price`] = 'Valid price required.';
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      customerID:  selectedCustomer.customerID,
      bookingDate: form.bookingDate,
      taxRate:     parseFloat(form.taxRate || 0),
      status:      form.status,
      notes:       form.notes || null,
      items: items.map(item => ({
        productID:     parseInt(item.productID),
        description:   item.description   || null,
        unitPrice:     parseFloat(item.unitPrice),
        quantity:      parseInt(item.quantity || 1),
        tripStart:     item.tripStart     || null,
        tripEnd:       item.tripEnd       || null,
        classTypeID:   item.classTypeID   || null,
        destinationID: item.destinationID || null,
        notes:         item.notes         || null,
      })),
      members: members.map(m => ({
        customerID:  m.customerID,
        shareAmount: parseFloat(m.shareAmount || 0),
      })),
    });
  };

  if (refLoading) return (
    <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

      {/* ── Lead customer ─────────────────────────────────── */}
      <Typography variant="h6" sx={{ color: KUKAT.navy }}>Lead customer</Typography>

      <Autocomplete
        options={customers}
        loading={custLoading}
        getOptionLabel={(o) =>
          `${o.firstName} ${o.lastName}${o.email ? ` — ${o.email}` : ''}`
        }
        value={selectedCustomer}
        onInputChange={(_, v, reason) => {
          if (reason === 'input') setCustomerQuery(v);
        }}
        onChange={(_, v) => {
          setSelectedCustomer(v);
          setErrors(e => ({ ...e, customerID: '' }));
        }}
        renderInput={(params) => (
          <TextField {...params} label="Search customer *"
            error={!!errors.customerID} helperText={errors.customerID}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {custLoading && <CircularProgress size={16} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      {/* ── Booking header ─────────────────────────────────── */}
      <Divider><Typography variant="caption">Booking details</Typography></Divider>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="Booking date *" type="date"
          value={form.bookingDate}
          onChange={(e) => setForm(f => ({ ...f, bookingDate: e.target.value }))}
          error={!!errors.bookingDate} helperText={errors.bookingDate}
          InputLabelProps={{ shrink: true }}
        />
        <TextField fullWidth label="Tax rate (%)" type="number"
          value={form.taxRate}
          onChange={(e) => setForm(f => ({ ...f, taxRate: e.target.value }))}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          inputProps={{ min: 0, max: 100, step: 0.5 }}
        />
        {isEdit && (
          <TextField select fullWidth label="Status"
            value={form.status}
            onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUSES.map(s => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      <TextField fullWidth label="Notes" multiline rows={2}
        value={form.notes}
        onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
        placeholder="Optional notes about this booking…"
      />

      {/* ── Booking items ──────────────────────────────────── */}
      <Divider>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart sx={{ fontSize: 14, color: KUKAT.textMuted }} />
          <Typography variant="caption">Booking items</Typography>
        </Box>
      </Divider>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
          Add one or more products to this booking. Each item can have its own dates, class and destination.
        </Typography>
        <Button size="small" startIcon={<Add />} variant="outlined"
          onClick={addItem} sx={{ flexShrink: 0, ml: 2 }}>
          Add item
        </Button>
      </Box>

      {items.map((item, i) => (
        <Box key={item._key} sx={{
          border: `1.5px solid ${KUKAT.border}`,
          borderRadius: 2, p: 2,
          background: i % 2 === 0 ? '#fff' : KUKAT.surface,
        }}>
          {/* Item header */}
          <Box sx={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', mb: 1.5,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={`Item ${i + 1}`} size="small"
                sx={{ background: `${KUKAT.navy}15`, color: KUKAT.navy, fontWeight: 700 }} />
              {item.supplierName && (
                <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                  {item.supplierName}
                  {item.commissionRate && (
                    <span style={{ color: '#15803D', fontWeight: 600, marginLeft: 4 }}>
                      ({parseFloat(item.commissionRate).toFixed(1)}% commission)
                    </span>
                  )}
                </Typography>
              )}
            </Box>
            <Tooltip title={items.length === 1 ? 'At least one item required' : 'Remove item'}>
              <span>
                <IconButton size="small" onClick={() => removeItem(item._key)}
                  disabled={items.length === 1}
                  sx={{ color: items.length === 1 ? KUKAT.border : '#EF4444' }}>
                  <Delete fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Product + price row */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },
            gap: 2, mb: 2,
          }}>
            <TextField select fullWidth label="Product *"
              value={item.productID}
              onChange={(e) => handleProductSelect(item._key, e.target.value)}
              error={!!errors[`item_${i}_product`]}
              helperText={errors[`item_${i}_product`]}>
              {products.map(p => (
                <MenuItem key={p.productID} value={p.productID}>
                  {p.productName}
                </MenuItem>
              ))}
            </TextField>

            <TextField fullWidth label="Unit price *" type="number"
              value={item.unitPrice} onChange={setItem(item._key, 'unitPrice')}
              error={!!errors[`item_${i}_price`]}
              helperText={errors[`item_${i}_price`]}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
            />

            <TextField fullWidth label="Quantity" type="number"
              value={item.quantity} onChange={setItem(item._key, 'quantity')}
              inputProps={{ min: 1 }}
            />
          </Box>

          {/* Line total */}
          {item.unitPrice && (
            <Box sx={{
              mb: 1.5, px: 1.5, py: 0.8,
              background: '#DCFCE7', borderRadius: 1,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 600 }}>
                Line total
              </Typography>
              <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 700 }}>
                {fmt(parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 1))}
              </Typography>
            </Box>
          )}

          {/* Trip dates + class + destination */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
            gap: 2,
          }}>
            <TextField fullWidth label="Trip start" type="date"
              value={item.tripStart} onChange={setItem(item._key, 'tripStart')}
              InputLabelProps={{ shrink: true }}
            />
            <TextField fullWidth label="Trip end" type="date"
              value={item.tripEnd} onChange={setItem(item._key, 'tripEnd')}
              InputLabelProps={{ shrink: true }}
            />
            <TextField select fullWidth label="Class"
              value={item.classTypeID} onChange={setItem(item._key, 'classTypeID')}>
              <MenuItem value="">— None —</MenuItem>
              {classTypes.map(c => (
                <MenuItem key={c.classID} value={c.classID}>
                  {c.description}
                </MenuItem>
              ))}
            </TextField>
            <TextField select fullWidth label="Destination"
              value={item.destinationID} onChange={setItem(item._key, 'destinationID')}>
              <MenuItem value="">— None —</MenuItem>
              {destinations.map(d => (
                <MenuItem key={d.destinationID} value={d.destinationID}>
                  {d.destinationName}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Optional description + notes */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2, mt: 2,
          }}>
            <TextField fullWidth label="Description" size="small"
              value={item.description} onChange={setItem(item._key, 'description')}
              placeholder="e.g. Return flight YYC–YVR" />
            <TextField fullWidth label="Item notes" size="small"
              value={item.notes} onChange={setItem(item._key, 'notes')} />
          </Box>
        </Box>
      ))}

      {/* ── Booking totals ─────────────────────────────────── */}
      <Box sx={{
        p: 2, borderRadius: 2,
        background: `${KUKAT.navy}08`,
        border: `1px solid ${KUKAT.border}`,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
            Items subtotal
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {fmt(itemsTotal)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
            Tax ({form.taxRate || 0}%)
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {fmt(taxAmount)}
          </Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography fontWeight={700} sx={{ color: KUKAT.navy }}>
            Grand total
          </Typography>
          <Typography fontWeight={700} sx={{ color: KUKAT.navy, fontSize: '1.1rem' }}>
            {fmt(grandTotal)}
          </Typography>
        </Box>
      </Box>

      {/* ── Group members ──────────────────────────────────── */}
      <Divider>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Group sx={{ fontSize: 14, color: KUKAT.textMuted }} />
          <Typography variant="caption">Additional travellers</Typography>
        </Box>
      </Divider>

      <Typography variant="body2" sx={{ color: KUKAT.textMuted }}>
        The lead customer is automatically included. Add extra travellers below and set their share of the total.
      </Typography>

      <Autocomplete
        options={memberOptions}
        getOptionLabel={(o) =>
          `${o.firstName} ${o.lastName}${o.email ? ` — ${o.email}` : ''}`
        }
        inputValue={memberQuery}
        onInputChange={(_, v) => setMemberQuery(v)}
        onChange={(_, v) => addMember(v)}
        value={null}
        renderInput={(params) => (
          <TextField {...params} size="small"
            label="Search and add a traveller by name or email" />
        )}
      />

      {members.length > 0 ? (
        <Table size="small" sx={{
          border: `1px solid ${KUKAT.border}`,
          borderRadius: 2, overflow: 'hidden',
        }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Share ($)</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((m, i) => (
              <TableRow key={m.customerID}
                sx={{ background: i % 2 === 0 ? '#fff' : KUKAT.surface }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {m.firstName} {m.lastName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: KUKAT.textMuted }}>
                    {m.email || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <TextField size="small" type="number"
                    value={m.shareAmount}
                    onChange={(e) => setMembers(prev => prev.map(x =>
                      x.customerID === m.customerID
                        ? { ...x, shareAmount: e.target.value }
                        : x
                    ))}
                    sx={{ width: 120 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => removeMember(m.customerID)}
                    sx={{ color: '#EF4444' }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Alert severity="info" sx={{ py: 0.5 }}>
          No additional travellers added yet. The lead customer is the only traveller.
        </Alert>
      )}

      {/* ── Actions ───────────────────────────────────────── */}
      <Box sx={{
        display: 'flex', gap: 2, justifyContent: 'flex-end',
        mt: 2, pt: 3, borderTop: `1px solid ${KUKAT.border}`,
      }}>
        <Button variant="outlined" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit}
          disabled={saving} sx={{ minWidth: 140 }}>
          {saving
            ? <CircularProgress size={20} sx={{ color: '#fff' }} />
            : isEdit ? 'Save changes' : 'Create booking'}
        </Button>
      </Box>

    </Box>
  );
}