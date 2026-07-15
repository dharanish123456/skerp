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
  Chip,
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  FileDownload as ExportIcon,
  ViewColumn as ColumnIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';

// ── Dummy Data ─────────────────────────────────────────────
const INITIAL_COMPANIES = [
  { id: 1, name: 'Acme Corporation', created: '2021-03-15', status: 'Active' },
  { id: 2, name: 'Globex Corporation', created: '2019-07-01', status: 'Active' },
  { id: 3, name: 'Initech Systems', created: '2020-11-20', status: 'Inactive' },
  { id: 4, name: 'Umbrella Corporation', created: '2022-01-10', status: 'Active' },
  { id: 5, name: 'Hooli Inc.', created: '2023-04-18', status: 'Active' },
  { id: 6, name: 'Soylent Corp', created: '2020-05-12', status: 'Active' },
  { id: 7, name: 'Virtucon', created: '2021-09-09', status: 'Inactive' },
  { id: 8, name: 'Vehement Capital Partners', created: '2022-08-11', status: 'Active' },
  { id: 9, name: 'Massive Dynamic', created: '2018-11-05', status: 'Active' },
  { id: 10, name: 'Wonka Industries', created: '2017-06-30', status: 'Active' },
  { id: 11, name: 'Oscorp Industries', created: '2020-10-14', status: 'Inactive' },
  { id: 12, name: 'LexCorp', created: '2019-03-29', status: 'Active' },
];

// ── Column definitions ─────────────────────────────────────
const ALL_COLUMNS = [
  { id: 'id', label: 'Company ID', sortable: true },
  { id: 'name', label: 'Company Name', sortable: true },
  { id: 'created', label: 'Date Created', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'actions', label: 'Actions', sortable: false },
];

// ── Sort helper ────────────────────────────────────────────
const descendingComparator = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
};
const getComparator = (order, orderBy) =>
  order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);

// ── Export to CSV ──────────────────────────────────────────
const exportToCSV = (rows, visibleCols) => {
  const cols = visibleCols.filter((c) => c !== 'actions');
  const header = cols.map((c) => ALL_COLUMNS.find((col) => col.id === c)?.label).join(',');
  const body = rows
    .map((row) =>
      cols
        .map((c) => {
          if (c === 'id') {
            return `"#${String(row.id).padStart(3, '0')}"`;
          }
          return `"${row[c] || ''}"`;
        })
        .join(',')
    )
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'companies.csv';
  a.click();
  URL.revokeObjectURL(url);
};

const Company = () => {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  
  // Table state
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('id');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [visibleCols, setVisibleCols] = useState([
    'id', 'name', 'created', 'status', 'actions'
  ]);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  // Dialog State
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [validationError, setValidationError] = useState('');
  const [editingCompanyId, setEditingCompanyId] = useState(null);

  // Toast State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  // Fetch Companies on Mount
  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      } else {
        console.error('Failed to fetch companies');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Filtered companies based on search
  const filtered = useMemo(() => {
    return companies.filter((company) =>
      company.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [companies, search]);

  // Sorted companies
  const sorted = useMemo(() => {
    return [...filtered].sort(getComparator(order, orderBy));
  }, [filtered, order, orderBy]);

  // Paginated companies
  const paginated = useMemo(() => {
    return sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  const handleSort = (colId) => {
    if (orderBy === colId) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(colId);
      setOrder('asc');
    }
  };

  const toggleColumn = (colId) => {
    setVisibleCols((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    );
  };

  const shownColumns = ALL_COLUMNS.filter((c) => visibleCols.includes(c.id));

  // Dialog actions
  const handleOpenDialog = () => {
    setValidationError('');
    setCompanyName('');
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setCompanyName('');
    setValidationError('');
    setEditingCompanyId(null);
  };

  const handleEditClick = (company) => {
    setEditingCompanyId(company.id);
    setCompanyName(company.name);
    setValidationError('');
    setOpen(true);
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    const trimmedName = companyName.trim();

    if (!trimmedName) {
      setValidationError('Company name is required');
      return;
    }

    if (editingCompanyId) {
      if (companies.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== editingCompanyId)) {
        setValidationError('A company with this name already exists');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/companies/${editingCompanyId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: trimmedName }),
        });

        if (response.ok) {
          const updatedCompany = await response.json();
          setCompanies(companies.map((c) => (c.id === editingCompanyId ? updatedCompany : c)));
          setToastMsg(`Company updated successfully!`);
          setToastSeverity('success');
          setToastOpen(true);
          handleCloseDialog();
        } else {
          const err = await response.json();
          setValidationError(err.message || 'Failed to update company');
        }
      } catch (error) {
        setValidationError('Error connecting to backend');
      }
    } else {
      if (companies.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        setValidationError('A company with this name already exists');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/companies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: trimmedName }),
        });

        if (response.ok) {
          const newCompany = await response.json();
          setCompanies([newCompany, ...companies]);
          setToastMsg(`Company "${trimmedName}" added successfully!`);
          setToastSeverity('success');
          setToastOpen(true);
          setPage(0);
          handleCloseDialog();
        } else {
          const err = await response.json();
          setValidationError(err.message || 'Failed to add company');
        }
      } catch (error) {
        setValidationError('Error connecting to backend');
      }
    }
  };

  const handleDeleteCompany = async (id, name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCompanies(companies.filter((c) => c.id !== id));
        setToastMsg(`Company "${name}" removed successfully.`);
        setToastSeverity('info');
        setToastOpen(true);
      } else {
        console.error('Failed to delete company');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${id}/toggle-status`, {
        method: 'PATCH',
      });
      if (response.ok) {
        const updated = await response.json();
        setCompanies(companies.map((c) => (c.id === id ? updated : c)));
      } else {
        console.error('Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem' }}
          >
            Company Directory
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', mt: 0.25 }}>
            {filtered.length} companies registered
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          sx={{
            backgroundColor: '#6366f1',
            color: '#ffffff',
            fontSize: '0.8125rem',
            textTransform: 'none',
            boxShadow: 'none',
            px: 2.5,
            py: 1,
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#4f46e5',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            },
          }}
        >
          Add Company
        </Button>
      </Box>

      {/* ── Main Panel ── */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
        }}
      >
        {/* Search Bar / Toolbar */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <TextField
            size="small"
            placeholder="Search companies by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '1rem', color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', sm: 320 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                fontSize: '0.8125rem',
                color: '#334155',
                backgroundColor: '#ffffff',
                '& fieldset': { borderColor: '#cbd5e1' },
                '&:hover fieldset': { borderColor: '#6366f1' },
                '&.Mui-focused fieldset': { borderColor: '#6366f1' },
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, flexWrap: 'nowrap' }}>
            {/* Export */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExportIcon />}
              onClick={() => exportToCSV(sorted, visibleCols)}
              sx={{
                borderColor: '#cbd5e1',
                color: '#475569',
                fontSize: '0.8125rem',
                textTransform: 'none',
                backgroundColor: '#ffffff',
                '&:hover': { borderColor: '#6366f1', color: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.05)' },
              }}
            >
              Export CSV
            </Button>

            {/* Column toggle */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<ColumnIcon />}
              onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
              sx={{
                borderColor: '#cbd5e1',
                color: '#475569',
                fontSize: '0.8125rem',
                textTransform: 'none',
                backgroundColor: '#ffffff',
                '&:hover': { borderColor: '#6366f1', color: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.05)' },
              }}
            >
              Columns
            </Button>

            <Menu
              anchorEl={columnMenuAnchor}
              open={Boolean(columnMenuAnchor)}
              onClose={() => setColumnMenuAnchor(null)}
              PaperProps={{
                sx: {
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                  p: 1,
                  minWidth: 180,
                },
              }}
            >
              <Typography sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Toggle Columns
              </Typography>
              <Divider sx={{ my: 0.5, borderColor: '#e2e8f0' }} />
              {ALL_COLUMNS.filter((c) => c.id !== 'actions').map((col) => (
                <MenuItem key={col.id} dense onClick={() => toggleColumn(col.id)} sx={{ borderRadius: '6px' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={visibleCols.includes(col.id)}
                        sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#6366f1' }, p: 0.5 }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.8125rem', color: '#334155' }}>{col.label}</Typography>}
                    sx={{ m: 0, gap: 0.5 }}
                  />
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer sx={{ maxHeight: 520 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {shownColumns.map((col) => (
                  <TableCell
                    key={col.id}
                    sortDirection={orderBy === col.id ? order : false}
                    sx={{
                      backgroundColor: '#f8fafc',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderBottom: '1px solid #e2e8f0',
                      whiteSpace: 'nowrap',
                      py: 1.5,
                    }}
                  >
                    {col.sortable ? (
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : 'asc'}
                        onClick={() => handleSort(col.id)}
                        sx={{
                          '&.Mui-active': { color: '#6366f1' },
                          '& .MuiTableSortLabel-icon': { color: '#6366f1 !important' },
                        }}
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
              {paginated.length > 0 ? (
                paginated.map((company, idx) => (
                  <TableRow
                    key={company.id}
                    hover
                    sx={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      '&:hover': { backgroundColor: '#f1f5f9' },
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    {shownColumns.map((col) => {
                      if (col.id === 'id') return (
                        <TableCell key={col.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#64748b', fontWeight: 500, borderBottom: '1px solid #e2e8f0' }}>
                          #{String(company.id).padStart(3, '0')}
                        </TableCell>
                      );

                      if (col.id === 'name') return (
                        <TableCell key={col.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#1e293b', fontWeight: 600, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon sx={{ color: '#6366f1', fontSize: '1.1rem' }} />
                            {company.name}
                          </Box>
                        </TableCell>
                      );

                      if (col.id === 'created') return (
                        <TableCell key={col.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          {company.created}
                        </TableCell>
                      );

                      if (col.id === 'status') return (
                        <TableCell key={col.id} sx={{ py: 1.25, borderBottom: '1px solid #e2e8f0' }}>
                          <Chip
                            label={company.status}
                            onClick={() => handleToggleStatus(company.id)}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              backgroundColor: company.status === 'Active' ? '#dcfce7' : '#fee2e2',
                              color: company.status === 'Active' ? '#15803d' : '#b91c1c',
                              height: 22,
                              border: 'none',
                              '&:hover': {
                                backgroundColor: company.status === 'Active' ? '#bbf7d0' : '#fecaca',
                              },
                            }}
                          />
                        </TableCell>
                      );

                      if (col.id === 'actions') return (
                        <TableCell key={col.id} sx={{ py: 1.25, borderBottom: '1px solid #e2e8f0' }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit Company">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditClick(company)}
                                sx={{
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '6px',
                                  '&:hover': { backgroundColor: '#f1f5f9' },
                                }}
                              >
                                <EditIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Company">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteCompany(company.id, company.name)}
                                sx={{
                                  border: '1px solid #fee2e2',
                                  borderRadius: '6px',
                                  '&:hover': { backgroundColor: '#fef2f2' },
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      );

                      return null;
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={shownColumns.length} align="center" sx={{ py: 6, color: '#64748b', fontSize: '0.875rem', borderBottom: '1px solid #e2e8f0' }}>
                    No companies match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Footer Pagination ── */}
        <Box sx={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              fontSize: '0.8125rem',
              color: '#64748b',
              '.MuiTablePagination-select': { fontSize: '0.8125rem', color: '#334155' },
              '.MuiTablePagination-displayedRows': { fontSize: '0.8125rem', color: '#475569' },
              '.MuiTablePagination-actions button': {
                color: '#475569',
                '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)', color: '#6366f1' },
                '&.Mui-disabled': { color: '#cbd5e1' },
              },
            }}
          />
        </Box>
      </Paper>

      {/* ── Add Company Dialog ── */}
      <Dialog
        open={open}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>
            {editingCompanyId ? 'Edit Company' : 'Add New Company'}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleAddCompany}>
          <DialogContent sx={{ p: 2, pt: 0 }}>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', display: 'block', mb: 0.75 }}>
                Company Name <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <TextField
                autoFocus
                fullWidth
                size="small"
                placeholder="e.g. Acme Corporation"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (validationError) setValidationError('');
                }}
                error={!!validationError}
                helperText={validationError}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#334155',
                    '& fieldset': { borderColor: '#cbd5e1' },
                    '&:hover fieldset': { borderColor: '#6366f1' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              size="small"
              sx={{
                borderColor: '#cbd5e1',
                color: '#475569',
                fontSize: '0.8125rem',
                textTransform: 'none',
                borderRadius: '6px',
                px: 2,
                '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f1f5f9' },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              sx={{
                backgroundColor: '#6366f1',
                color: '#ffffff',
                fontSize: '0.8125rem',
                textTransform: 'none',
                borderRadius: '6px',
                px: 2.5,
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#4f46e5',
                },
              }}
            >
              {editingCompanyId ? 'Save Changes' : 'Add Company'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Snackbar Toast ── */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          variant="filled"
          sx={{ borderRadius: '8px', fontSize: '0.8125rem' }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Company;
