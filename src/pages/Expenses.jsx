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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  MenuItem,
  Divider,
  Grid,
  Card,
  CardContent,
  Select,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from '../services/expenseService';
import { useAuth } from '../context/AuthContext';

// Standard columns for expense table
const COLUMNS = [
  { id: 'expenseDate', label: 'Date', sortable: true },
  { id: 'amount', label: 'Amount', sortable: true },
  { id: 'category', label: 'Category', sortable: true },
  { id: 'description', label: 'Description', sortable: true },
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

const Expenses = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('CREATE_EXPENSES');
  const canEdit = hasPermission('EDIT_EXPENSES');
  const canDelete = hasPermission('DELETE_EXPENSES');
  // Expense lists and summaries
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    totalToday: 0,
    totalThisWeek: 0,
    totalThisMonth: 0,
    categoryBreakdown: [],
  });

  // Table filters & state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('expenseDate');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals / Dialog state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Forms state
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Category manage forms state
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('ri:price-tag-3-line');
  const [newCatColor, setNewCatColor] = useState('#64748b');

  // Feedback toasts
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');
  const [validationError, setValidationError] = useState('');
  const [hoveredChartSlice, setHoveredChartSlice] = useState(null);

  // Fetch initial data
  const loadData = async () => {
    try {
      const activeCats = await getCategories();
      setCategories(activeCats);

      // Load expenses based on filters
      const expenseList = await getExpenses({
        startDate: filterStartDate,
        endDate: filterEndDate,
        categoryId: filterCategory,
      });
      setExpenses(expenseList);

      // Fetch summary
      const sum = await getExpenseSummary({
        startDate: filterStartDate,
        endDate: filterEndDate,
      });
      setSummary(sum);
    } catch (error) {
      showToast(error.message || 'Error connecting to backend', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStartDate, filterEndDate, filterCategory]);

  const showToast = (msg, severity = 'success') => {
    setToastMsg(msg);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // Sort helper
  const descendingComparator = (a, b, orderBy) => {
    let valA = a[orderBy];
    let valB = b[orderBy];

    // Handle nested category object comparison
    if (orderBy === 'category') {
      valA = a.category?.name || '';
      valB = b.category?.name || '';
    }

    if (valB < valA) return -1;
    if (valB > valA) return 1;
    return 0;
  };

  const getComparator = (order, orderBy) =>
    order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);

  // Processed search/filter list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const descMatch = (exp.description || '').toLowerCase().includes(search.toLowerCase());
      const catMatch = (exp.category?.name || '').toLowerCase().includes(search.toLowerCase());
      return descMatch || catMatch;
    });
  }, [expenses, search]);

  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort(getComparator(order, orderBy));
  }, [filteredExpenses, order, orderBy]);

  const paginatedExpenses = useMemo(() => {
    return sortedExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedExpenses, page, rowsPerPage]);

  const handleSort = (colId) => {
    if (orderBy === colId) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(colId);
      setOrder('asc');
    }
  };

  // Form actions
  const handleOpenAddExpense = () => {
    setEditingExpenseId(null);
    setAmount('');
    setSelectedCategoryId(categories.length > 0 ? categories[0].id : '');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setValidationError('');
    setExpenseDialogOpen(true);
  };

  const handleOpenEditExpense = (exp) => {
    setEditingExpenseId(exp.id);
    setAmount(exp.amount);
    setSelectedCategoryId(exp.category?.id || '');
    setExpenseDate(exp.expenseDate);
    setDescription(exp.description || '');
    setValidationError('');
    setExpenseDialogOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setValidationError('Please enter a valid amount greater than zero');
      return;
    }
    if (!selectedCategoryId) {
      setValidationError('Please select a category');
      return;
    }
    if (!expenseDate) {
      setValidationError('Please select a date');
      return;
    }

    const payload = {
      amount: parseFloat(amount),
      categoryId: parseInt(selectedCategoryId),
      expenseDate,
      description,
    };

    try {
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, payload);
        showToast('Expense updated successfully');
      } else {
        await addExpense(payload);
        showToast('Expense added successfully');
      }
      setExpenseDialogOpen(false);
      loadData();
    } catch (error) {
      setValidationError(error.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        showToast('Expense deleted', 'info');
        loadData();
      } catch (error) {
        showToast(error.message, 'error');
      }
    }
  };

  // Category CRUD actions
  const handleAddOrUpdateCategory = async (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      showToast('Category name is required', 'warning');
      return;
    }

    const payload = {
      name: trimmed,
      icon: newCatIcon,
      color: newCatColor,
    };

    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
        showToast('Category updated');
      } else {
        await addCategory(payload);
        showToast('Category created');
      }
      // Reset form
      setNewCatName('');
      setEditingCategoryId(null);
      // Reload categories & expenses
      const activeCats = await getCategories();
      setCategories(activeCats);
      loadData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleEditCategoryInit = (cat) => {
    setEditingCategoryId(cat.id);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon || 'ri:price-tag-3-line');
    setNewCatColor(cat.color || '#64748b');
  };

  const handleDeleteCategoryClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? Any linked expenses will be reassigned to Miscellaneous.')) {
      try {
        await deleteCategory(id);
        showToast('Category deleted', 'info');
        const activeCats = await getCategories();
        setCategories(activeCats);
        loadData();
      } catch (error) {
        showToast(error.message, 'error');
      }
    }
  };

  // Custom calculation for SVG Pie Chart
  const pieChartData = useMemo(() => {
    const data = summary.categoryBreakdown || [];
    const total = data.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

    let cumulativeFraction = 0;
    return data.map((item) => {
      const totalAmount = Number(item.totalAmount) || 0;
      const fraction = total > 0 ? totalAmount / total : 0;
      const percentage = fraction * 100;
      const startFraction = cumulativeFraction;
      cumulativeFraction += fraction;

      // Coordinate helper
      const getCoordinatesForFraction = (value) => {
        const x = Math.cos(2 * Math.PI * (value - 0.25));
        const y = Math.sin(2 * Math.PI * (value - 0.25));
        return [x, y];
      };

      const [startX, startY] = getCoordinatesForFraction(startFraction);
      const [endX, endY] = getCoordinatesForFraction(cumulativeFraction);
      const largeArcFlag = percentage > 50 ? 1 : 0;

      // SVG path definition
      const pathData = total > 0
        ? percentage >= 99.999
          ? 'M 0 -1 A 1 1 0 1 1 0 1 A 1 1 0 1 1 0 -1 Z'
          : `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
        : '';

      return {
        ...item,
        totalAmount,
        percentage,
        pathData,
      };
    });
  }, [summary.categoryBreakdown]);

  const chartTotal = useMemo(
    () => (summary.categoryBreakdown || []).reduce((sum, c) => sum + (Number(c.totalAmount) || 0), 0),
    [summary.categoryBreakdown],
  );

  const activeChartSlice = hoveredChartSlice || null;

  // Clean filters helper
  const handleClearFilters = () => {
    setFilterCategory('');
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
          <Card sx={{ borderLeft: '5px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <CardContent sx={{ py: 2.5 }}>
              <Typography color="text.secondary" variant="overline" fontWeight="bold" sx={{ fontSize: '0.72rem', letterSpacing: 1.2 }}>
                Today's Spend
              </Typography>
              <Typography color="#1e293b" sx={{ mt: 1, fontWeight: 700, fontSize: { xs: '1.8rem', md: '2rem' }, lineHeight: 1.1 }}>
                {formatCurrency(summary.totalToday)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ borderLeft: '5px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <CardContent sx={{ py: 2.5 }}>
              <Typography color="text.secondary" variant="overline" fontWeight="bold" sx={{ fontSize: '0.72rem', letterSpacing: 1.2 }}>
                This Week's Spend
              </Typography>
              <Typography color="#1e293b" sx={{ mt: 1, fontWeight: 700, fontSize: { xs: '1.8rem', md: '2rem' }, lineHeight: 1.1 }}>
                {formatCurrency(summary.totalThisWeek)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ borderLeft: '5px solid #8b5cf6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <CardContent sx={{ py: 2.5 }}>
              <Typography color="text.secondary" variant="overline" fontWeight="bold" sx={{ fontSize: '0.72rem', letterSpacing: 1.2 }}>
                This Month's Spend
              </Typography>
              <Typography color="#1e293b" sx={{ mt: 1, fontWeight: 700, fontSize: { xs: '1.8rem', md: '2rem' }, lineHeight: 1.1 }}>
                {formatCurrency(summary.totalThisMonth)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Main dashboard content grids */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(320px, 0.9fr) minmax(0, 1.6fr)' },
          gap: 3,
          alignItems: 'start',
          mb: 4,
        }}
      >
        {/* SVG Chart display */}
        <Box sx={{ minWidth: 0 }}>
          <Paper sx={{ p: 2.5, height: '100%', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, fontSize: '1.15rem', lineHeight: 1.35 }}>
              Category Breakdown (Current Range)
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            {summary.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center">
                {/* Custom circular SVG Donut chart */}
                <Box sx={{ position: 'relative', width: '160px', height: '160px', mb: 2.5, flex: '0 0 auto' }}>
                  <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    {pieChartData.map((slice) => (
                      <path
                        key={slice.categoryId}
                        d={slice.pathData}
                        fill={slice.color || '#cbd5e1'}
                        onMouseEnter={() => setHoveredChartSlice(slice)}
                        onMouseLeave={() => setHoveredChartSlice(null)}
                        style={{
                          cursor: 'pointer',
                          filter: hoveredChartSlice?.categoryId === slice.categoryId ? 'brightness(1.08)' : 'none',
                          opacity: hoveredChartSlice && hoveredChartSlice.categoryId !== slice.categoryId ? 0.72 : 1,
                          transition: 'opacity 160ms ease, filter 160ms ease',
                        }}
                      />
                    ))}
                    {/* Inner hole to make it a donut chart */}
                    <circle cx="0" cy="0" r="0.6" fill="#ffffff" />
                  </svg>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      width: '90px',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1 }}>
                      {activeChartSlice ? activeChartSlice.categoryName : 'Total'}
                    </Typography>
                    <Typography fontWeight="bold" sx={{ fontSize: '0.92rem', lineHeight: 1.15 }}>
                      {formatCurrency(activeChartSlice?.totalAmount ?? chartTotal, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </Typography>
                    {activeChartSlice && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.1 }}>
                        {activeChartSlice.percentage.toFixed(1)}%
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Progress-list Legend */}
                <Box width="100%">
                  {pieChartData.map((slice) => (
                    <Box
                      key={slice.categoryId}
                      onMouseEnter={() => setHoveredChartSlice(slice)}
                      onMouseLeave={() => setHoveredChartSlice(null)}
                      sx={{ mb: 1.5, cursor: 'pointer' }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Box display="flex" alignItems="center">
                          <Box
                            sx={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '3px',
                              backgroundColor: slice.color || '#cbd5e1',
                              mr: 1,
                            }}
                          />
                          <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.86rem' }}>
                            {slice.categoryName}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                          {formatCurrency(slice.totalAmount, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })} ({slice.percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                      {/* Sub-bar */}
                      <Box sx={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <Box
                          sx={{
                            width: `${slice.percentage}%`,
                            height: '100%',
                            backgroundColor: slice.color || '#cbd5e1',
                            borderRadius: '3px',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="240px">
                <Typography color="text.secondary">No expense data for this range.</Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Expenses List & Controls Table */}
        <Box sx={{ minWidth: 0 }}>
          <Paper sx={{ p: 2.5, borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
            {/* Header toolbar */}
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ gap: 1.5, mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>
                Recent Expenses
              </Typography>
              <Box display="flex" sx={{ gap: 1 }}>
                {canCreate && <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => setCategoryDialogOpen(true)}
                  size="small"
                  sx={{ fontSize: '0.78rem' }}
                >
                  Categories
                </Button>}
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddExpense}
                  size="small"
                  sx={{ fontSize: '0.78rem' }}
                >
                  Add Expense
                </Button>
              </Box>
            </Box>

            {/* Filter controls */}
            <Box display="flex" flexWrap="wrap" sx={{ gap: 1.2, mb: 2.5, backgroundColor: '#f8fafc', p: 1.5, borderRadius: '8px' }}>
              <TextField
                label="Search Description"
                variant="outlined"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flexGrow: 1, minWidth: '150px', '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl size="small" sx={{ minWidth: '130px', '& .MuiInputBase-input': { fontSize: '0.9rem' } }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
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

              {(filterCategory || filterStartDate || filterEndDate) && (
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
                  {paginatedExpenses.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.expenseDate}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                        {formatCurrency(row.amount)}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {row.category?.icon && (
                            <Box sx={{ mr: 1, display: 'flex', color: row.category.color || '#64748b' }}>
                              <iconify-icon icon={row.category.icon} style={{ fontSize: '1.1rem' }}></iconify-icon>
                            </Box>
                          )}
                          <Chip
                            label={row.category?.name || 'N/A'}
                            size="small"
                            sx={{
                              backgroundColor: `${row.category?.color || '#e2e8f0'}15`,
                              color: row.category?.color || '#475569',
                              border: `1px solid ${row.category?.color || '#e2e8f0'}30`,
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell color="text.secondary">{row.description || '—'}</TableCell>
                      <TableCell>
                        {canEdit && <IconButton size="small" color="primary" onClick={() => handleOpenEditExpense(row)}>
                          <EditIcon fontSize="inherit" />
                        </IconButton>}
                        {canDelete && <IconButton size="small" color="error" onClick={() => handleDeleteExpense(row.id)}>
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No expenses found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={sortedExpenses.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Paper>
        </Box>
      </Box>

      {/* ── EXPENSE ADD/EDIT DIALOG ──────────────────────────────────── */}
      <Dialog open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {validationError && <Alert severity="error">{validationError}</Alert>}

            <TextField
              label="Amount"
              type="number"
              variant="outlined"
              required
              fullWidth
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
            />

            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategoryId}
                label="Category"
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              type="date"
              label="Date"
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              slotProps={{ inputLabel: { shrink: true } }}
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />

            <TextField
              label="Description (Optional)"
              variant="outlined"
              multiline
              rows={2}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveExpense} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── CATEGORIES MANAGEMENT DIALOG ────────────────────────────── */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Categories</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Left form category */}
            {(canCreate || (editingCategoryId && canEdit)) && <Grid item xs={12} sm={5}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                {editingCategoryId ? 'Edit Category' : 'Create Category'}
              </Typography>
              <Box component="form" onSubmit={handleAddOrUpdateCategory} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Category Name"
                  variant="outlined"
                  size="small"
                  required
                  fullWidth
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />

                <TextField
                  label="Icon Tag (Iconify)"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  helperText="e.g. ri:car-line"
                />

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Color
                  </Typography>
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    style={{ width: '100%', height: '38px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                  />
                </Box>

                <Box display="flex" gap={1}>
                  <Button type="submit" variant="contained" size="small" fullWidth>
                    {editingCategoryId ? 'Update' : 'Create'}
                  </Button>
                  {editingCategoryId && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setNewCatName('');
                        setNewCatIcon('ri:price-tag-3-line');
                        setNewCatColor('#64748b');
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>}

            {/* Right List categories */}
            <Grid item xs={12} sm={7}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                Existing Categories
              </Typography>
              <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                {categories.map((cat) => (
                  <Box
                    key={cat.id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      p: 1.5,
                      borderBottom: '1px solid #f1f5f9',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      <Box sx={{ mr: 1.5, display: 'flex', color: cat.color || '#475569' }}>
                        <iconify-icon icon={cat.icon || 'ri:price-tag-3-line'} style={{ fontSize: '1.2rem' }}></iconify-icon>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {cat.name}
                      </Typography>
                    </Box>

                    {/* Disable action buttons for Miscellaneous default category */}
                    {cat.name.toLowerCase() !== 'miscellaneous' && (canEdit || canDelete) ? (
                      <Box>
                        {canEdit && <IconButton size="small" color="primary" onClick={() => handleEditCategoryInit(cat)}>
                          <EditIcon fontSize="inherit" />
                        </IconButton>}
                        {canDelete && <IconButton size="small" color="error" onClick={() => handleDeleteCategoryClick(cat.id)}>
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>}
                      </Box>
                    ) : cat.name.toLowerCase() === 'miscellaneous' ? (
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1, fontStyle: 'italic' }}>
                        System Default
                      </Typography>
                    ) : null}
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCategoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar open={toastOpen} autoHideDuration={4000} onClose={() => setToastOpen(false)}>
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Expenses;
