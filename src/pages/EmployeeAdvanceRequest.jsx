import { useState, useMemo, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, InputAdornment, TableContainer, Table, TableHead,
  TableBody, TableRow, TableCell, TableSortLabel, TablePagination, IconButton, Button,
  Drawer, Snackbar, Alert, Tooltip, Grid, Card, CardContent, Chip,
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, Close as CloseIcon,
  CurrencyRupee as RupeeIcon, Cancel as CancelIcon,
} from '@mui/icons-material';
import { fetchMyAdvances, createMyAdvanceRequest, cancelMyAdvance } from '../services/employeeAdvanceService';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
  { id: 'id', label: 'ID', sortable: true },
  { id: 'advanceDate', label: 'Date', sortable: true },
  { id: 'amount', label: 'Amount', sortable: true },
  { id: 'reason', label: 'Reason', sortable: true },
  { id: 'paymentMode', label: 'Status', sortable: true },
  { id: 'notes', label: 'Notes', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const EmployeeAdvanceRequest = () => {
  const { hasPermission } = useAuth();
  const canRequest = hasPermission('REQUEST_ADVANCE');

  const [advances, setAdvances] = useState([]);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('advanceDate');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const loadData = async () => {
    try {
      const data = await fetchMyAdvances();
      setAdvances(data);
    } catch (error) {
      showToast(error.message || 'Error loading advances', 'error');
    }
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (msg, severity = 'success') => {
    setToastMsg(msg); setToastSeverity(severity); setToastOpen(true);
  };

  const summary = useMemo(() => {
    const totalAmount = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const pendingCount = advances.filter(a => a.status === 'PENDING' || a.paymentMode === 'Pending Approval').length;
    return { totalCount: advances.length, totalAmount, pendingCount };
  }, [advances]);

  const filteredAdvances = useMemo(() => {
    return advances.filter((adv) => {
      const reasonMatch = (adv.reason || '').toLowerCase().includes(search.toLowerCase());
      const notesMatch = (adv.notes || '').toLowerCase().includes(search.toLowerCase());
      const adminNotesMatch = (adv.adminNotes || '').toLowerCase().includes(search.toLowerCase());
      const dateMatch = (adv.advanceDate || '').includes(search);
      return reasonMatch || notesMatch || adminNotesMatch || dateMatch;
    });
  }, [advances, search]);

  const sortedAdvances = useMemo(() => {
    return [...filteredAdvances].sort((a, b) => {
      let valA = a[orderBy]; let valB = b[orderBy];
      if (orderBy === 'amount') { valA = Number(valA) || 0; valB = Number(valB) || 0; }
      if (valB < valA) return order === 'desc' ? -1 : 1;
      if (valB > valA) return order === 'desc' ? 1 : -1;
      return 0;
    });
  }, [filteredAdvances, order, orderBy]);

  const paginatedAdvances = useMemo(() =>
    sortedAdvances.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedAdvances, page, rowsPerPage]);

  const handleSort = (colId) => {
    if (orderBy === colId) setOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setOrderBy(colId); setOrder('asc'); }
  };

  const handleOpenDrawer = () => {
    setAmount(''); setReason(''); setNotes(''); setValidationError(''); setDrawerOpen(true);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setValidationError('Amount must be greater than zero'); return; }
    if (!reason.trim()) { setValidationError('Please provide a reason for the advance'); return; }
    try {
      await createMyAdvanceRequest({ amount: parseFloat(amount), reason, notes });
      showToast('Advance request submitted successfully!');
      setDrawerOpen(false);
      loadData();
    } catch (error) {
      setValidationError(error.message);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this advance request?')) return;
    try {
      await cancelMyAdvance(id);
      showToast('Advance request cancelled', 'info');
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const getStatusChip = (adv) => {
    const status = adv.status || (adv.paymentMode === 'Pending Approval' ? 'PENDING' : 'APPROVED');
    if (status === 'PENDING') {
      return <Chip label="Pending" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: '0.75rem' }} />;
    }
    if (status === 'REJECTED') {
      return (
        <Tooltip title={adv.adminNotes ? `Rejection Reason: ${adv.adminNotes}` : 'Request Rejected'}>
          <Chip label="Rejected" size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600, fontSize: '0.75rem' }} />
        </Tooltip>
      );
    }
    if (status === 'CANCELLED') {
      return <Chip label="Cancelled" size="small" sx={{ bgcolor: '#f3f4f6', color: '#4b5563', fontWeight: 600, fontSize: '0.75rem' }} />;
    }
    return <Chip label="Approved" size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 600, fontSize: '0.75rem' }} />;
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RupeeIcon sx={{ color: '#6366f1', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>Total Requests</Typography>
                <Typography variant="h5" fontWeight="bold">{summary.totalCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RupeeIcon sx={{ color: '#10b981', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>Total Amount</Typography>
                <Typography variant="h5" fontWeight="bold">{formatCurrency(summary.totalAmount)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RupeeIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>Pending Requests</Typography>
                <Typography variant="h5" fontWeight="bold">{summary.pendingCount}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Action Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <TextField
          size="small"
          placeholder="Search by reason, notes, or date..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment> }}
          sx={{ minWidth: 280 }}
        />
        {canRequest && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDrawer}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
            Request Advance
          </Button>
        )}
      </Paper>

      {/* Data Table */}
      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {COLUMNS.map(col => (
                  <TableCell key={col.id} sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {col.sortable ? (
                      <TableSortLabel active={orderBy === col.id} direction={orderBy === col.id ? order : 'asc'} onClick={() => handleSort(col.id)}>
                        {col.label}
                      </TableSortLabel>
                    ) : col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAdvances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                    {advances.length === 0 ? 'No advance requests yet. Click "Request Advance" to get started.' : 'No matching results found.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAdvances.map((adv) => (
                  <TableRow key={adv.id} hover sx={{ '&:hover': { bgcolor: '#faf5ff' } }}>
                    <TableCell sx={{ fontSize: '0.85rem' }}>#{adv.id}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{adv.advanceDate}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatCurrency(adv.amount)}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adv.reason || '—'}</TableCell>
                    <TableCell>{getStatusChip(adv)}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {adv.notes || adv.adminNotes || '—'}
                    </TableCell>
                    <TableCell>
                      {(adv.status === 'PENDING' || adv.paymentMode === 'Pending Approval') && canRequest && (
                        <Tooltip title="Cancel Request">
                          <IconButton size="small" onClick={() => handleCancel(adv.id)} sx={{ color: '#ef4444' }}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredAdvances.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      {/* Request Advance Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>Request Advance</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>Submit a new advance request</Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
        </Box>
        <Box component="form" onSubmit={handleSubmitRequest} sx={{ flex: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {validationError && <Alert severity="error" sx={{ borderRadius: 2 }}>{validationError}</Alert>}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 0.5, display: 'block' }}>
              Amount <span style={{ color: '#ef4444' }}>*</span>
            </Typography>
            <TextField
              fullWidth size="small" type="number" value={amount}
              onChange={(e) => { setAmount(e.target.value); setValidationError(''); }}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              placeholder="Enter amount"
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 0.5, display: 'block' }}>
              Reason <span style={{ color: '#ef4444' }}>*</span>
            </Typography>
            <TextField
              fullWidth size="small" multiline rows={3} value={reason}
              onChange={(e) => { setReason(e.target.value); setValidationError(''); }}
              placeholder="Why do you need this advance?"
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 0.5, display: 'block' }}>
              Additional Notes
            </Typography>
            <TextField
              fullWidth size="small" multiline rows={2} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details (optional)"
            />
          </Box>
        </Box>
        <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => setDrawerOpen(false)} sx={{ textTransform: 'none', borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" type="submit" onClick={handleSubmitRequest}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
            Submit Request
          </Button>
        </Box>
      </Drawer>

      <Snackbar open={toastOpen} autoHideDuration={4000} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={toastSeverity} onClose={() => setToastOpen(false)} variant="filled" sx={{ borderRadius: 2 }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeAdvanceRequest;
