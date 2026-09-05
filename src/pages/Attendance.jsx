import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem,
  Paper, Select, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
  EventAvailable as PresentIcon, EventBusy as AbsentIcon,
  Schedule as HalfDayIcon, TaskAlt as CompleteIcon,
  LocationOn as LocationIcon, CameraAlt as SelfieIcon,
} from '@mui/icons-material';
import api from '../config/api';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  createAttendance, deleteAttendance, fetchAttendance,
  fetchAttendanceSummary, updateAttendance,
} from '../services/attendanceService';

// Derive backend origin from API base URL (e.g. "http://localhost:8087/api" -> "http://localhost:8087")
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const backendUrl = (path) => (path && path.startsWith('/')) ? BACKEND_ORIGIN + path : path;

// Reverse geocoding cache (persists across re-renders)
const geoCache = {};
const reverseGeocode = async (lat, lng) => {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geoCache[key]) return geoCache[key];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address || {};
    // Build a short, readable label: suburb/town/city, district/state
    const place = addr.suburb || addr.town || addr.village || addr.city || addr.county || '';
    const region = addr.state_district || addr.state || addr.country || '';
    const label = [place, region].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || key;
    geoCache[key] = label;
    return label;
  } catch {
    geoCache[key] = key;
    return key;
  }
};

const EMPTY_FORM = {
  employeeId: '', attendanceDate: new Date().toISOString().slice(0, 10),
  checkIn: '', checkOut: '', status: 'PRESENT', notes: '',
};

const STATUS_STYLE = {
  PRESENT: { backgroundColor: '#dcfce7', color: '#15803d' },
  ABSENT: { backgroundColor: '#fee2e2', color: '#b91c1c' },
  HALF_DAY: { backgroundColor: '#fef3c7', color: '#a16207' },
};

const formatTime = (value) => {
  if (!value) return '—';
  const [hour, minute] = value.split(':').map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined) return '—';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const Attendance = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('CREATE_ATTENDANCE');
  const canEdit = hasPermission('EDIT_ATTENDANCE');
  const canDelete = hasPermission('DELETE_ATTENDANCE');
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({ totalRecords: 0, present: 0, absent: 0, halfDay: 0, completedCheckOuts: 0 });
  const [filters, setFilters] = useState({ employeeId: '', startDate: '', endDate: '', status: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  const [previewSelfie, setPreviewSelfie] = useState(null);
  const [locationNames, setLocationNames] = useState({});
  const geocodeBatch = useRef(null);

  const params = useMemo(() => Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '')
  ), [filters]);

  const showFeedback = (message, severity = 'success') => setFeedback({ open: true, message, severity });

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, totals] = await Promise.all([
        fetchAttendance(params), fetchAttendanceSummary(params),
      ]);
      setRecords(rows);
      setSummary(totals);
      setPage(0);
    } catch (error) {
      showFeedback(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    const timer = window.setTimeout(loadAttendance, 0);
    return () => window.clearTimeout(timer);
  }, [loadAttendance]);

  // Reverse geocode all unique coordinates when records change
  useEffect(() => {
    if (!records.length) return;
    const pairs = new Map();
    records.forEach((r) => {
      if (r.latitude && r.longitude) pairs.set(`${r.latitude.toFixed(4)},${r.longitude.toFixed(4)}`, [r.latitude, r.longitude]);
      if (r.checkoutLatitude && r.checkoutLongitude) pairs.set(`${r.checkoutLatitude.toFixed(4)},${r.checkoutLongitude.toFixed(4)}`, [r.checkoutLatitude, r.checkoutLongitude]);
    });
    // Skip pairs already cached
    const toFetch = [...pairs.entries()].filter(([key]) => !locationNames[key]);
    if (!toFetch.length) return;
    // Cancel previous batch
    let cancelled = false;
    (async () => {
      const results = {};
      for (const [key, [lat, lng]] of toFetch) {
        if (cancelled) break;
        results[key] = await reverseGeocode(lat, lng);
        // Small delay to respect Nominatim rate limit (1 req/sec)
        await new Promise((r) => setTimeout(r, 1100));
      }
      if (!cancelled) setLocationNames((prev) => ({ ...prev, ...results }));
    })();
    return () => { cancelled = true; };
  }, [records]);

  useEffect(() => {
    api.get('/employees')
      .then((response) => setEmployees(response.data))
      .catch(() => showFeedback('Unable to load employees', 'error'));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, employeeId: employees[0]?.id || '' });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({
      employeeId: record.employeeId,
      attendanceDate: record.attendanceDate,
      checkIn: record.checkIn?.slice(0, 5) || '',
      checkOut: record.checkOut?.slice(0, 5) || '',
      status: record.status,
      notes: record.notes || '',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const saveRecord = async () => {
    if (!form.employeeId || !form.attendanceDate || !form.status) {
      setFormError('Employee, date, and status are required');
      return;
    }
    if (form.status === 'PRESENT' && form.checkOut && !form.checkIn) {
      setFormError('Check in is required when check out is entered');
      return;
    }
    if (form.status === 'PRESENT' && form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      setFormError('Check out must be after check in');
      return;
    }
    const payload = {
      employeeId: Number(form.employeeId),
      attendanceDate: form.attendanceDate,
      status: form.status,
      checkIn: form.status === 'PRESENT' && form.checkIn ? `${form.checkIn}:00` : null,
      checkOut: form.status === 'PRESENT' && form.checkOut ? `${form.checkOut}:00` : null,
      notes: form.notes.trim() || null,
    };
    try {
      if (editingId) {
        await updateAttendance(editingId, payload);
        showFeedback('Attendance updated successfully');
      } else {
        await createAttendance(payload);
        showFeedback('Attendance created successfully');
      }
      setDialogOpen(false);
      await loadAttendance();
    } catch (error) {
      setFormError(error.message);
    }
  };

  const removeRecord = async (record) => {
    if (!window.confirm(`Delete attendance for ${record.employeeName} on ${record.attendanceDate}?`)) return;
    try {
      await deleteAttendance(record.id);
      showFeedback('Attendance deleted', 'info');
      await loadAttendance();
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  };

  const cards = [
    ['Total Records', summary.totalRecords, CompleteIcon, '#4f46e5', '#eef2ff'],
    ['Present', summary.present, PresentIcon, '#15803d', '#dcfce7'],
    ['Absent', summary.absent, AbsentIcon, '#b91c1c', '#fee2e2'],
    ['Half Day', summary.halfDay, HalfDayIcon, '#a16207', '#fef3c7'],
  ];
  const paginated = records.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem' }}>Attendance</Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.8125rem' }}>Monitor employee check-in & check-out verification (selfies & GPS)</Typography>
        </Box>
        {canCreate && <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: 'none' }}>Add Attendance</Button>}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
        {cards.map(([label, value, Icon, color, background]) => (
          <Card key={label} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '16px !important' }}>
              <Box sx={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: 2, color, background }}><Icon /></Box>
              <Box><Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{label}</Typography><Typography sx={{ fontSize: '1.35rem', fontWeight: 700 }}>{value || 0}</Typography></Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: '2fr repeat(3, 1fr)' }, gap: 1.5, background: '#f8fafc' }}>
          <FormControl size="small"><InputLabel>Employee</InputLabel><Select label="Employee" value={filters.employeeId} onChange={(e) => setFilters((v) => ({ ...v, employeeId: e.target.value }))}><MenuItem value="">All employees</MenuItem>{employees.map((employee) => <MenuItem key={employee.id} value={employee.id}>{employee.name}</MenuItem>)}</Select></FormControl>
          <TextField size="small" type="date" label="From" value={filters.startDate} onChange={(e) => setFilters((v) => ({ ...v, startDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" type="date" label="To" value={filters.endDate} onChange={(e) => setFilters((v) => ({ ...v, endDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          <FormControl size="small"><InputLabel>Status</InputLabel><Select label="Status" value={filters.status} onChange={(e) => setFilters((v) => ({ ...v, status: e.target.value }))}><MenuItem value="">All statuses</MenuItem><MenuItem value="PRESENT">Present</MenuItem><MenuItem value="ABSENT">Absent</MenuItem><MenuItem value="HALF_DAY">Half Day</MenuItem></Select></FormControl>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ background: '#f8fafc' }}>
              <TableRow>
                {['Date', 'Employee', 'Status', 'Check In', 'In Photo & GPS', 'Check Out', 'Out Photo & GPS', 'Worked', 'Notes', 'Actions'].map((heading) => (
                  <TableCell key={heading} sx={{ fontWeight: 700, color: '#64748b' }}>{heading}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && paginated.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{ py: 6, color: '#64748b' }}>No attendance records found.</TableCell></TableRow>}
              {paginated.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{record.attendanceDate}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{record.employeeName}</TableCell>
                  <TableCell><Chip size="small" label={record.status.replace('_', ' ')} sx={{ ...STATUS_STYLE[record.status], fontWeight: 700, fontSize: '0.7rem' }} /></TableCell>
                  <TableCell>{formatTime(record.checkIn)}</TableCell>

                  {/* Check In Selfie & GPS */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {record.selfieUrl ? (
                        <Tooltip title="Click to view Check In photo">
                          <Avatar
                            src={backendUrl(record.selfieUrl)}
                            alt="Check In Selfie"
                            onClick={() => setPreviewSelfie({ title: 'Check-In Selfie', url: backendUrl(record.selfieUrl), employee: record.employeeName, date: record.attendanceDate, time: record.checkIn })}
                            sx={{ width: 32, height: 32, cursor: 'pointer', border: '2px solid #16a34a', transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.15)' } }}
                          />
                        </Tooltip>
                      ) : '—'}
                      {record.latitude && record.longitude ? (
                        <Tooltip title="Open Check In location in Google Maps">
                          <Chip
                            icon={<LocationIcon sx={{ fontSize: '0.9rem !important' }} />}
                            label={locationNames[`${record.latitude.toFixed(4)},${record.longitude.toFixed(4)}`] || `${record.latitude.toFixed(3)}, ${record.longitude.toFixed(3)}`}
                            component="a"
                            href={`https://maps.google.com/?q=${record.latitude},${record.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            clickable
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                          />
                        </Tooltip>
                      ) : null}
                    </Box>
                  </TableCell>

                  <TableCell>{formatTime(record.checkOut)}</TableCell>

                  {/* Check Out Selfie & GPS */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {record.checkoutSelfieUrl ? (
                        <Tooltip title="Click to view Check Out photo">
                          <Avatar
                            src={backendUrl(record.checkoutSelfieUrl)}
                            alt="Check Out Selfie"
                            onClick={() => setPreviewSelfie({ title: 'Check-Out Selfie', url: backendUrl(record.checkoutSelfieUrl), employee: record.employeeName, date: record.attendanceDate, time: record.checkOut })}
                            sx={{ width: 32, height: 32, cursor: 'pointer', border: '2px solid #ea580c', transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.15)' } }}
                          />
                        </Tooltip>
                      ) : '—'}
                      {record.checkoutLatitude && record.checkoutLongitude ? (
                        <Tooltip title="Open Check Out location in Google Maps">
                          <Chip
                            icon={<LocationIcon sx={{ fontSize: '0.9rem !important' }} />}
                            label={locationNames[`${record.checkoutLatitude.toFixed(4)},${record.checkoutLongitude.toFixed(4)}`] || `${record.checkoutLatitude.toFixed(3)}, ${record.checkoutLongitude.toFixed(3)}`}
                            component="a"
                            href={`https://maps.google.com/?q=${record.checkoutLatitude},${record.checkoutLongitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            clickable
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                          />
                        </Tooltip>
                      ) : null}
                    </Box>
                  </TableCell>

                  <TableCell>{formatDuration(record.workedMinutes)}</TableCell>
                  <TableCell sx={{ maxWidth: 180 }}>{record.notes || '—'}</TableCell>
                  <TableCell><Box sx={{ display: 'flex' }}>{canEdit && <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(record)}><EditIcon fontSize="small" /></IconButton></Tooltip>}{canDelete && <Tooltip title="Delete"><IconButton color="error" size="small" onClick={() => removeRecord(record)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>}</Box></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={records.length} page={page} onPageChange={(_, value) => setPage(value)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} />
      </Paper>

      {/* Edit / Add Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit Attendance' : 'Add Attendance'}</DialogTitle>
        <DialogContent><Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <FormControl fullWidth><InputLabel>Employee</InputLabel><Select label="Employee" value={form.employeeId} onChange={(e) => setForm((v) => ({ ...v, employeeId: e.target.value }))}>{employees.map((employee) => <MenuItem key={employee.id} value={employee.id}>{employee.name}</MenuItem>)}</Select></FormControl>
          <TextField type="date" label="Attendance Date" value={form.attendanceDate} onChange={(e) => setForm((v) => ({ ...v, attendanceDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          <FormControl fullWidth><InputLabel>Status</InputLabel><Select label="Status" value={form.status} onChange={(e) => setForm((v) => ({ ...v, status: e.target.value, ...(e.target.value !== 'PRESENT' ? { checkIn: '', checkOut: '' } : {}) }))}><MenuItem value="PRESENT">Present</MenuItem><MenuItem value="ABSENT">Absent</MenuItem><MenuItem value="HALF_DAY">Half Day</MenuItem></Select></FormControl>
          {form.status === 'PRESENT' && <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}><TextField type="time" label="Check In" value={form.checkIn} onChange={(e) => setForm((v) => ({ ...v, checkIn: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /><TextField type="time" label="Check Out" value={form.checkOut} onChange={(e) => setForm((v) => ({ ...v, checkOut: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Box>}
          <TextField label="Notes" multiline minRows={2} value={form.notes} onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))} />
        </Box></DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveRecord}>Save</Button></DialogActions>
      </Dialog>

      {/* Selfie Preview Modal */}
      <Dialog open={Boolean(previewSelfie)} onClose={() => setPreviewSelfie(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {previewSelfie?.title || 'Selfie Preview'} – {previewSelfie?.employee}
        </DialogTitle>
        <DialogContent align="center">
          <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 2 }}>
            Date: {previewSelfie?.date} | Time: {formatTime(previewSelfie?.time)}
          </Typography>
          {previewSelfie && (
            <img
              src={previewSelfie.url}
              alt="Selfie Full Preview"
              style={{ width: '100%', maxHeight: 380, borderRadius: 12, objectFit: 'cover' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewSelfie(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={feedback.open} autoHideDuration={4000} onClose={() => setFeedback((v) => ({ ...v, open: false }))}><Alert severity={feedback.severity} onClose={() => setFeedback((v) => ({ ...v, open: false }))}>{feedback.message}</Alert></Snackbar>
    </Box>
  );
};

export default Attendance;
