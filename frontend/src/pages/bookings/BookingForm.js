import React, { useState, useEffect, useRef } from 'react';
import {
  Box, TextField, MenuItem, Button, Typography,
  Divider, Switch, FormControlLabel, Autocomplete,
  CircularProgress, Alert, InputAdornment, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody, Chip,
} from '@mui/material';
import { Add, Delete, Group } from '@mui/icons-material';
import { useBookingFormData } from '../../hooks/useBookings';
import { bookingsApi } from '../../api/index';
import { KUKAT } from '../../styles/theme';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const toDateInput = (val) => {
  if (!val) return '';
  return new Date(val).toISOString().slice(0, 10);
};

const EMPTY = {
  customerID: null, productID: null, destinationID: '',
  classID: '', feeID: '', bookingDate: '', tripStart: '',
  tripEnd: '', numberOfTravellers: 1, description: '',
  basePrice: '', taxRate: 5, status: 'pending',
  isGroupBooking: false, groupName: '',
};

const BookingForm = ({ initial = {}, onSave, onCancel, saving }) => {
  const { destinations, classTypes, fees, products, loading: refLoading } = useBookingFormData();

const [form, setForm] = useState({
  ...EMPTY,
  ...initial,
  // ← Format dates so they display correctly in date inputs
  bookingDate: toDateInput(initial?.bookingDate),
  tripStart:   toDateInput(initial?.tripStart),
  tripEnd:     toDateInput(initial?.tripEnd),
});
const [customerQuery, setCustQuery]     = useState('');
const [customers,     setCustomers]     = useState([]);
const [custLoading,   setCustLoading]   = useState(false);
const [members,       setMembers]       = useState(initial.members || []);
const [memberQuery,   setMemberQuery]   = useState('');
const [memberOptions, setMemberOptions] = useState([]);
const [errors,        setErrors]        = useState({});
const [selectedCustomer, setSelectedCustomer] = useState(
  initial?.customerID && initial?.customerFirstName
    ? { 
        customerID: initial.customerID,
        firstName:  initial.customerFirstName,
        lastName:   initial.customerLastName,
        email:      initial.customerEmail || '',
      }
    : null
);

useEffect(() => {
  if (initial?.customerID && customers.length > 0 && !selectedCustomer) {
    const found = customers.find(c => c.customerID === initial.customerID);
    if (found) setSelectedCustomer(found);
  }
}, [customers]);


  // Pre-load existing customer when editing
useEffect(() => {
  if (!customerQuery || customerQuery.length < 2) {
    if (!form.customerID) setCustomers([]);
    return;
  }
  setCustLoading(true);
  bookingsApi.getCustomers({ search: customerQuery, limit: 'all' })
    .then(({ data }) => {
      const list = data.customers ?? data.data ?? data;
      setCustomers(Array.isArray(list) ? list : []);
    })
    .catch(() => {})
    .finally(() => setCustLoading(false));
}, [customerQuery]);

const preloaded = useRef(false);

useEffect(() => {
  if (!initial?.customerID || preloaded.current) return;
  preloaded.current = true;
  setCustLoading(true);
  bookingsApi.getCustomers({ search: '', limit: 'all' })
    .then(({ data }) => {
      const list = data.customers ?? data.data ?? data;
      if (Array.isArray(list)) {
        const found = list.find(c => c.customerID === initial.customerID);
        if (found) setCustomers([found]);
      }
    })
    .catch(() => {})
    .finally(() => setCustLoading(false));
}, [initial?.customerID]);

  // Group member search
  useEffect(() => {
    if (!memberQuery || memberQuery.length < 2) { setMemberOptions([]); return; }
    bookingsApi.getCustomers({ search: memberQuery, limit: 'all' })
      .then(({ data }) => setMemberOptions(data.customers ?? data.data ?? data))
      .catch(() => {});
  }, [memberQuery]);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.customerID) e.customerID = 'Lead customer is required';
    if (!form.productID)  e.productID  = 'Product is required';
    if (!form.bookingDate) e.bookingDate = 'Booking date is required';
    if (!form.basePrice || isNaN(+form.basePrice)) e.basePrice = 'Valid price is required';
    if (form.isGroupBooking && !form.groupName) e.groupName = 'Group name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = { ...form, members };
    onSave(payload);
  };

  const addMember = (customer) => {
    if (!customer) return;
    if (members.find((m) => m.customerID === customer.customerID)) return;
    const share = form.basePrice
      ? parseFloat((+form.basePrice / (members.length + 2)).toFixed(2))
      : 0;
    setMembers((m) => [...m, { ...customer, role: 'member', shareAmount: share, sharePaid: 0, shareStatus: 'unpaid' }]);
    setMemberQuery('');
    setMemberOptions([]);
  };

  const removeMember = (id) => setMembers((m) => m.filter((x) => x.customerID !== id));

  const totalPrice = form.basePrice
    ? (parseFloat(form.basePrice) * (1 + parseFloat(form.taxRate || 0) / 100)).toFixed(2)
    : '—';

  if (refLoading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* ── Lead customer ─────────────────────────────── */}
      <Typography variant="h6" sx={{ color: KUKAT.navy }}>Lead customer</Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
      }}>
        <Autocomplete
          options={customers}
          loading={custLoading}
          getOptionLabel={(o) => `${o.firstName} ${o.lastName} — ${o.email || o.city || ''}`}
          value={selectedCustomer}
          onInputChange={(_, v, reason) => {
            if (reason === 'input') setCustQuery(v);

          }}
          onChange={(_, v) => {
            setSelectedCustomer(v);
            setForm((f) => ({ ...f, customerID: v?.customerID || null }));
            setErrors((e) => ({ ...e, customerID: '' }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search customer *"
              error={!!errors.customerID}
              helperText={errors.customerID}
              InputProps={{ ...params.InputProps,
                endAdornment: <>{custLoading && <CircularProgress size={16} />}{params.InputProps.endAdornment}</>,
              }}
            />
          )}
        />

        <TextField
          select fullWidth label="Product *"
          value={form.productID || ''}
          onChange={set('productID')}
          error={!!errors.productID}
          helperText={errors.productID}
        >
          {products.map((p) => (
            <MenuItem key={p.productID} value={p.productID}>{p.productName}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* ── Trip details ──────────────────────────────── */}
      <Divider><Typography variant="caption">Trip details</Typography></Divider>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
      }}>
        <TextField
          select fullWidth label="Destination"
          value={form.destinationID} onChange={set('destinationID')}
        >
          <MenuItem value="">— None —</MenuItem>
          {destinations.map((d) => (
            <MenuItem key={d.destinationID} value={d.destinationID}>{d.destinationName}</MenuItem>
          ))}
        </TextField>

        <TextField
          select fullWidth label="Class"
          value={form.classID} onChange={set('classID')}
        >
          <MenuItem value="">— None —</MenuItem>
          {classTypes.map((c) => (
            <MenuItem key={c.classID} value={c.classID}>{c.description}</MenuItem>
          ))}
        </TextField>

        <TextField
          select fullWidth label="Booking fee"
          value={form.feeID} onChange={set('feeID')}
        >
          <MenuItem value="">— None —</MenuItem>
          {fees.map((f) => (
            <MenuItem key={f.feeID} value={f.feeID}>
              {f.description} (${f.feeAmount})
            </MenuItem>
          ))}
        </TextField>

        <TextField fullWidth label="Booking date *" type="date"
          value={form.bookingDate} onChange={set('bookingDate')}
          error={!!errors.bookingDate} helperText={errors.bookingDate}
          InputLabelProps={{ shrink: true }}
        />

        <TextField fullWidth label="Trip start" type="date"
          value={form.tripStart} onChange={set('tripStart')}
          InputLabelProps={{ shrink: true }}
        />

        <TextField fullWidth label="Trip end" type="date"
          value={form.tripEnd} onChange={set('tripEnd')}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* ── Travellers + Status ───────────────────────── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="Travellers" type="number"
          value={form.numberOfTravellers} onChange={set('numberOfTravellers')}
          inputProps={{ min: 1 }}
        />

        <TextField
          select fullWidth label="Status"
          value={form.status} onChange={set('status')}
        >
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
          ))}
        </TextField>
      </Box>

      {/* ── Pricing ───────────────────────────────────── */}
      <Divider><Typography variant="caption">Pricing</Typography></Divider>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 2,
      }}>
        <TextField fullWidth label="Base price *" type="number"
          value={form.basePrice} onChange={set('basePrice')}
          error={!!errors.basePrice} helperText={errors.basePrice}
          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
        />

        <TextField fullWidth label="Tax rate (%)" type="number"
          value={form.taxRate} onChange={set('taxRate')}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
        />

        <TextField fullWidth label="Total (calculated)" value={`$${totalPrice}`}
          disabled
          sx={{ '& .MuiInputBase-input': { fontWeight: 600, color: KUKAT.navy } }}
        />
      </Box>

      <TextField fullWidth label="Description" multiline rows={2}
        value={form.description} onChange={set('description')}
        placeholder="Optional notes about this booking…"
      />

      {/* ── Group booking ─────────────────────────────── */}
      <Divider><Typography variant="caption">Group booking</Typography></Divider>

      <FormControlLabel
        control={
          <Switch
            checked={form.isGroupBooking}
            onChange={(e) => setForm((f) => ({ ...f, isGroupBooking: e.target.checked }))}
            color="primary"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Group sx={{ fontSize: 18, color: KUKAT.teal }} />
            <Typography variant="body2" fontWeight={500}>This is a group booking</Typography>
          </Box>
        }
      />

      {form.isGroupBooking && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}>
            <TextField fullWidth label="Group name *"
              value={form.groupName} onChange={set('groupName')}
              error={!!errors.groupName} helperText={errors.groupName}
              placeholder="e.g. Smith Family, Acme Corp Trip"
            />
          </Box>

          <Typography variant="body2" fontWeight={600} sx={{ color: KUKAT.navy }}>
            Group members
          </Typography>

          <Autocomplete
            options={memberOptions}
            getOptionLabel={(o) => `${o.firstName} ${o.lastName} — ${o.email || o.city}`}
            inputValue={memberQuery}
            onInputChange={(_, v) => setMemberQuery(v)}
            onChange={(_, v) => addMember(v)}
            value={null}
            renderInput={(params) => (
              <TextField {...params} label="Add member — search by name or email" size="small" />
            )}
          />

          {members.length > 0 ? (
            <Table size="small" sx={{ border: `1px solid ${KUKAT.border}`, borderRadius: 2, overflow: 'hidden' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Share ($)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.customerID}>
                    <TableCell>{m.firstName} {m.lastName}</TableCell>
                    <TableCell>
                      <Chip label={m.role} size="small"
                        sx={{ textTransform: 'capitalize', fontSize: '0.7rem',
                          backgroundColor: m.role === 'lead' ? '#FEF9C3' : '#F1F5F9',
                          color: m.role === 'lead' ? '#854D0E' : '#475569',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small" type="number"
                        value={m.shareAmount}
                        onChange={(e) => setMembers((ms) => ms.map((x) =>
                          x.customerID === m.customerID
                            ? { ...x, shareAmount: +e.target.value }
                            : x
                        ))}
                        sx={{ width: 110 }}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={m.shareStatus} size="small"
                        sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }} />
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
            <Alert severity="info">
              Search and add group members above. The lead customer is already included.
            </Alert>
          )}
        </Box>
      )}

      {/* ── Actions ───────────────────────────────────── */}
      <Box sx={{
        display: 'flex', gap: 2, justifyContent: 'flex-end',
        mt: 2, pt: 3, borderTop: `1px solid ${KUKAT.border}`,
      }}>
        <Button variant="outlined" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}
          sx={{ minWidth: 140 }}>
          {saving
            ? <CircularProgress size={20} sx={{ color: '#fff' }} />
            : initial.bookingID ? 'Save changes' : 'Create booking'}
        </Button>
      </Box>

    </Box>
  );
}

export default BookingForm;