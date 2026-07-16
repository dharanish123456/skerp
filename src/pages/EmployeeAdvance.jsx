import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  TablePagination,
  IconButton,
  Button,
  Drawer,
  Snackbar,
  Alert,
  Tooltip,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
  CalendarMonth as CalendarIcon,
  CurrencyRupee as RupeeIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import {
  fetchEmployeeAdvances,
  createEmployeeAdvance,
  updateEmployeeAdvance,
  deleteEmployeeAdvance,
  fetchAdvanceSummary,
  fetchEmployees,
} from '../services/employeeAdvanceService';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
  { id: 'id', label: 'Advance ID', sortable: true },
  { id: 'employeeName', label: 'Employee', sortable: true },
  { id: 'advanceDate', label: 'Advance Date', sortable: true },
  { id: 'amount', label: 'Amount', sortable: true },
  { id: 'paymentMode', label: 'Payment Mode', sortable: true },
  { id: 'reason', label: 'Reason', sortable: true },
  { id: 'notes', label: 'Notes', sortable: true },
  { id: 'actions', label: 'Actions', sortable: false },
];

const formatCurrency = (value, options = {}) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(Number(value) || 0);

const dateFieldSx = {
  width: '135px',
  '& .MuiInputBase-input': {
    colorScheme: 'light',
    fontSize: '0.9rem',
  },
  '& input[type="date"]::-webkit-calendar-picker-indicator': {
    cursor: 'pointer',
    filter: 'invert(34%) sepia(13%) saturate(1057%) hue-rotate(177deg) brightness(91%) contrast(88%)',
    opacity: 1,
  },
};

const EmployeeAdvance = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('CREATE_ADVANCES');
  const canEdit = hasPermission('EDIT_ADVANCES');
  const canDelete = hasPermission('DELETE_ADVANCES');
  // Master lists
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState({
    totalAdvanceGiven: 0,
    totalRecords: 0,
    uniqueEmployeesCount: 0,
  });

  // Filters state
  const [search, setSearch] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Table state
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('advanceDate');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Drawer state
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);

  // Form states - Advance
  const [editingAdvanceId, setEditingAdvanceId] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  // Toast / validation states
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');
  const [validationError, setValidationError] = useState('');

  const loadData = async () => {
    try {
      // Load active employees for dropdown
      const empList = await fetchEmployees();
      setEmployees(empList.filter(e => e.status?.toLowerCase() === 'active' || e.status === 'Active'));

      // Fetch advances using filters
      const advanceList = await fetchEmployeeAdvances({
        employeeId: filterEmployeeId,
        startDate: filterStartDate,
        endDate: filterEndDate,
      });
      setAdvances(advanceList);

      // Fetch summary
      const sum = await fetchAdvanceSummary({
        startDate: filterStartDate,
        endDate: filterEndDate,
      });
      setSummary(sum);
    } catch (error) {
      showToast(error.message || 'Error loading employee advances data', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [filterEmployeeId, filterStartDate, filterEndDate]);

  const showToast = (msg, severity = 'success') => {
    setToastMsg(msg);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // Local search filtering (matches search key with employee name or reason)
  const filteredAdvances = useMemo(() => {
    return advances.filter((adv) => {
      const nameMatch = (adv.employeeName || '').toLowerCase().includes(search.toLowerCase());
      const reasonMatch = (adv.reason || '').toLowerCase().includes(search.toLowerCase());
      return nameMatch || reasonMatch;
    });
  }, [advances, search]);

  // Sort helper
  const descendingComparator = (a, b, orderBy) => {
    let valA = a[orderBy];
    let valB = b[orderBy];

    if (valB < valA) return -1;
    if (valB > valA) return 1;
    return 0;
  };

  const getComparator = (order, orderBy) =>
    order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);

  const sortedAdvances = useMemo(() => {
    return [...filteredAdvances].sort(getComparator(order, orderBy));
  }, [filteredAdvances, order, orderBy]);

  const paginatedAdvances = useMemo(() => {
    return sortedAdvances.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedAdvances, page, rowsPerPage]);

  const handleSort = (colId) => {
    if (orderBy === colId) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(colId);
      setOrder('asc');
    }
  };

  // Form triggers - Add/Edit Advance
  const handleOpenAddAdvance = () => {
    setEditingAdvanceId(null);
    setSelectedEmployeeId(employees.length > 0 ? employees[0].id : '');
    setAdvanceDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setReason('');
    setPaymentMode('Cash');
    setReferenceNo('');
    setNotes('');
    setValidationError('');
    setAdvanceDialogOpen(true);
  };

  const handleOpenEditAdvance = (adv) => {
    setEditingAdvanceId(adv.id);
    setSelectedEmployeeId(adv.employeeId || '');
    setAdvanceDate(adv.advanceDate);
    setAmount(adv.amount);
    setReason(adv.reason || '');
    setPaymentMode(adv.paymentMode || 'Cash');
    setReferenceNo(adv.referenceNo || '');
    setNotes(adv.notes || '');
    setValidationError('');
    setAdvanceDialogOpen(true);
  };

  const handleSaveAdvance = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setValidationError('Please select an employee');
      return;
    }
    if (!advanceDate) {
      setValidationError('Please select an advance date');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setValidationError('Amount must be greater than zero');
      return;
    }

    const payload = {
      employeeId: parseInt(selectedEmployeeId),
      advanceDate,
      amount: parseFloat(amount),
      reason,
      paymentMode,
      referenceNo,
      notes,
    };

    try {
      if (editingAdvanceId) {
        await updateEmployeeAdvance(editingAdvanceId, payload);
        showToast('Employee advance updated successfully');
      } else {
        await createEmployeeAdvance(payload);
        showToast('Employee advance created successfully');
      }
      setAdvanceDialogOpen(false);
      loadData();
    } catch (error) {
      setValidationError(error.message);
    }
  };

  const handleDeleteAdvance = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee advance record?')) {
      try {
        await deleteEmployeeAdvance(id);
        showToast('Advance record deleted successfully', 'info');
        loadData();
      } catch (error) {
        showToast(error.message, 'error');
      }
    }
  };

  const handleClearFilters = () => {
    setFilterEmployeeId('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  return (
    <Box sx={{ flexGrow: 1, mt: 1 }}>
      {/* Top Summaries Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          gap: 3,
          mb: 3,
        }}
      >
        <Box>
          <Card sx={{ borderLeft: '5px solid #0ea5e9', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <CardContent sx={{ py: 2.5 }}>
              <Typography color="text.secondary" variant="overline" fontWeight="bold" sx={{ fontSize: '0.72rem', letterSpacing: 1.2 }}>
                Total Advance Given
              </Typography>
              <Typography color="#1e293b" sx={{ mt: 1, fontWeight: 700, fontSize: { xs: '1.6rem', md: '1.8rem' }, lineHeight: 1.1 }}>
                {formatCurrency(summary.totalAdvanceGiven)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ borderLeft: '5px solid #6366f1', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <CardContent sx={{ py: 2.5 }}>
              <Typography color="text.secondary" variant="overline" fontWeight="bold" sx={{ fontSize: '0.72rem', letterSpacing: 1.2 }}>
                Total Records
              </Typography>
              <Typography color="#1e293b" sx={{ mt: 1, fontWeight: 700, fontSize: { xs: '1.6rem', md: '1.8rem' }, lineHeight: 1.1 }}>
                {summary.totalRecords}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ borderLeft: '5px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <CardContent sx={{ py: 2.5 }}>
              <Typography color="text.secondary" variant="overline" fontWeight="bold" sx={{ fontSize: '0.72rem', letterSpacing: 1.2 }}>
                Employees Assisted
              </Typography>
              <Typography color="#1e293b" sx={{ mt: 1, fontWeight: 700, fontSize: { xs: '1.6rem', md: '1.8rem' }, lineHeight: 1.1 }}>
                {summary.uniqueEmployeesCount}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Main Grid: Filters + Table */}
      <Paper sx={{ p: 2.5, borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
        {/* Header Toolbar */}
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ gap: 1.5, mb: 2.5 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem', color: '#1e293b' }}>
              Employee Advance List
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Track and store advances issued to employees
            </Typography>
          </Box>
          {canCreate && <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddAdvance}
            size="small"
            sx={{
              fontSize: '0.8rem',
              backgroundColor: '#3b82f6',
              textTransform: 'none',
              borderRadius: '6px',
              '&:hover': { backgroundColor: '#2563eb' }
            }}
          >
            New Advance
          </Button>}
        </Box>

        {/* Filter Controls */}
        <Box display="flex" flexWrap="wrap" sx={{ gap: 1.2, mb: 2.5, backgroundColor: '#f8fafc', p: 1.5, borderRadius: '8px' }}>
          <TextField
            label="Search Employee / Reason"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '180px', '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: '180px', '& .MuiInputBase-input': { fontSize: '0.9rem' } }}>
            <InputLabel>Employee</InputLabel>
            <Select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              label="Employee"
            >
              <MenuItem value="">All Employees</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            label="Start Date"
            InputLabelProps={{ shrink: true }}
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            sx={dateFieldSx}
          />

          <TextField
            type="date"
            label="End Date"
            InputLabelProps={{ shrink: true }}
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            sx={dateFieldSx}
          />

          {(filterEmployeeId || filterStartDate || filterEndDate) && (
            <IconButton onClick={handleClearFilters} size="small" color="secondary" title="Clear Filters">
              <ClearIcon />
            </IconButton>
          )}
        </Box>

        {/* Table layout */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {COLUMNS.map((col) => (
                  <TableCell key={col.id}>
                    {col.sortable ? (
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : 'asc'}
                        onClick={() => handleSort(col.id)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAdvances.map((row) => {
                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>ADV-{row.id}</TableCell>
                    <TableCell>{row.employeeName}</TableCell>
                    <TableCell>{row.advanceDate}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                      {formatCurrency(row.amount)}
                    </TableCell>
                    <TableCell>{row.paymentMode || '—'}</TableCell>
                    <TableCell color="text.secondary">{row.reason || '—'}</TableCell>
                    <TableCell color="text.secondary" sx={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.notes || '—'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex">
                        {canEdit && <Tooltip title="Edit Advance">
                          <IconButton size="small" color="secondary" onClick={() => handleOpenEditAdvance(row)}>
                            <EditIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>}
                        {canDelete && <Tooltip title="Delete Advance">
                          <IconButton size="small" color="error" onClick={() => handleDeleteAdvance(row.id)}>
                            <DeleteIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedAdvances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No employee advances found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={sortedAdvances.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* ── ADVANCE ADD/EDIT DRAWER ──────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={advanceDialogOpen}
        onClose={() => setAdvanceDialogOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 480 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        {/* Gradient Header */}
        <Box
          sx={{
            background: editingAdvanceId
              ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
              : 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            px: 3,
            pt: 3,
            pb: 4,
            color: '#fff',
            position: 'relative',
          }}
        >
          <IconButton
            size="small"
            onClick={() => setAdvanceDialogOpen(false)}
            sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.15)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)', width: 44, height: 44 }}>
              <MoneyIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                {editingAdvanceId ? 'Edit Advance' : 'New Employee Advance'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {editingAdvanceId ? 'Update advance details below' : 'Fill in the details to record an advance'}
              </Typography>
            </Box>
          </Box>

          {/* Live employee pill (shows when employee selected) */}
          {selectedEmployeeId && !editingAdvanceId && (
            <Chip
              icon={<PersonIcon style={{ color: '#fff' }} />}
              label={employees.find(e => e.id === selectedEmployeeId || e.id === Number(selectedEmployeeId))?.name || ''}
              size="small"
              sx={{ backgroundColor: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: 600, border: '1px solid rgba(255,255,255,0.35)', mt: 0.5 }}
            />
          )}
        </Box>

        {/* Scrollable Form Body */}
        <Box
          component="form"
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 3,
            pt: 3,
            pb: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            mt: -2,
            backgroundColor: '#f8fafc',
          }}
        >
          {validationError && (
            <Alert severity="error" sx={{ borderRadius: '8px', mt: 1 }}>
              {validationError}
            </Alert>
          )}

          {/* Section: Who */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
            <Typography variant="overline" color="text.secondary" fontWeight={700} fontSize="0.65rem" letterSpacing={1.2} display="block" mb={1.5}>
              Employee Details
            </Typography>
            <FormControl fullWidth required size="small">
              <InputLabel>Select Employee *</InputLabel>
              <Select
                value={selectedEmployeeId}
                label="Select Employee *"
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={!!editingAdvanceId}
                sx={{ borderRadius: '8px' }}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#dbeafe', color: '#1d4ed8' }}>
                        {emp.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{emp.name}</Typography>
                        {emp.role && <Typography variant="caption" color="text.secondary">{emp.role}</Typography>}
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {/* Section: Advance Info */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
            <Typography variant="overline" color="text.secondary" fontWeight={700} fontSize="0.65rem" letterSpacing={1.2} display="block" mb={1.5}>
              Advance Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <TextField
                type="date"
                label="Advance Date *"
                required
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                slotProps={{ inputLabel: { shrink: true } }}
                value={advanceDate}
                onChange={(e) => setAdvanceDate(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
              <TextField
                label="Amount *"
                type="number"
                size="small"
                required
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Box>
            <TextField
              label="Reason"
              variant="outlined"
              size="small"
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical emergency, salary advance..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Paper>

          {/* Section: Payment Details */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
            <Typography variant="overline" color="text.secondary" fontWeight={700} fontSize="0.65rem" letterSpacing={1.2} display="block" mb={1.5}>
              Payment Details
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={paymentMode}
                  label="Payment Mode"
                  onChange={(e) => setPaymentMode(e.target.value)}
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="Cash">💵 Cash</MenuItem>
                  <MenuItem value="Bank Transfer">🏦 Bank Transfer</MenuItem>
                  <MenuItem value="UPI">📱 UPI</MenuItem>
                  <MenuItem value="Cheque">📄 Cheque</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Reference No"
                size="small"
                fullWidth
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="UTR / Cheque no."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Box>
            <TextField
              label="Notes"
              variant="outlined"
              size="small"
              multiline
              rows={2}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Paper>
        </Box>

        {/* Sticky Footer Actions */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#fff',
            display: 'flex',
            gap: 1.5,
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setAdvanceDialogOpen(false)}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSaveAdvance}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              background: editingAdvanceId
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                : 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              boxShadow: editingAdvanceId
                ? '0 4px 14px rgba(99,102,241,0.4)'
                : '0 4px 14px rgba(37,99,235,0.4)',
              '&:hover': {
                opacity: 0.92,
                boxShadow: 'none',
              },
            }}
          >
            {editingAdvanceId ? '✏️  Update Advance' : '💰  Record Advance'}
          </Button>
        </Box>
      </Drawer>

      <Snackbar open={toastOpen} autoHideDuration={4000} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toastSeverity} onClose={() => setToastOpen(false)} sx={{ borderRadius: '6px' }}>{toastMsg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeAdvance;
