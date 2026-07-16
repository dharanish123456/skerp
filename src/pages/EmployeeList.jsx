import { useState, useMemo, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, InputAdornment,
  TableContainer, Table, TableHead, TableBody, TableRow,
  TableCell, TableSortLabel, TablePagination, IconButton,
  Tooltip, Chip, Button, Menu, MenuItem, Checkbox,
  FormControlLabel, Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FileDownload as ExportIcon,
  ViewColumn as ColumnIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

// ── Column definitions ─────────────────────────────────────
const ALL_COLUMNS = [
  { id: 'id',             label: 'Emp ID',          sortable: true  },
  { id: 'name',           label: 'Name',            sortable: true  },
  { id: 'email',          label: 'Email',           sortable: true  },
  { id: 'phone',          label: 'Phone',           sortable: true  },
  { id: 'gender',         label: 'Gender',          sortable: true  },
  { id: 'dob',            label: 'DOB',             sortable: true  },
  { id: 'state',          label: 'State',           sortable: true  },
  { id: 'district',       label: 'District',        sortable: true  },
  { id: 'department',     label: 'Department',      sortable: true  },
  { id: 'employmentType', label: 'Employment Type', sortable: true  },
  { id: 'wages',          label: 'Wages/Salary',    sortable: true  },
  { id: 'joined',         label: 'Joined',          sortable: true  },
  { id: 'status',         label: 'Status',          sortable: true  },
  { id: 'actions',        label: 'Actions',         sortable: false },
];

// ── Status chip colors ─────────────────────────────────────
const statusColor = (status) => {
  switch (status) {
    case 'Active':   return { bg: '#dcfce7', color: '#15803d' };
    case 'Inactive': return { bg: '#fee2e2', color: '#b91c1c' };
    case 'On Leave': return { bg: '#fef9c3', color: '#a16207' };
    default:         return { bg: '#f1f5f9', color: '#475569' };
  }
};

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
  const cols = visibleCols.filter(c => c !== 'actions');
  const header = cols.map(c => ALL_COLUMNS.find(col => col.id === c)?.label).join(',');
  const body = rows.map(row => cols.map(c => {
    if (c === 'phone') {
      return `"${row.countryCode} ${row.phone}"`;
    }
    return `"${row[c] || ''}"`;
  }).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'employees.csv';
  a.click();
  URL.revokeObjectURL(url);
};

// ── Component ──────────────────────────────────────────────
const EmployeeList = ({ onAddClick, onEditClick }) => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('CREATE_EMPLOYEES');
  const canEdit = hasPermission('EDIT_EMPLOYEES');
  const canDelete = hasPermission('DELETE_EMPLOYEES');
  const [employees, setEmployees] = useState([]);
  const [search, setSearch]           = useState('');
  const [order, setOrder]             = useState('asc');
  const [orderBy, setOrderBy]         = useState('id');
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [visibleCols, setVisibleCols] = useState([
    'id', 'name', 'phone', 'department', 'employmentType', 'wages', 'status', 'joined', 'actions'
  ]);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await api.delete(`/employees/${id}`);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter
  const filtered = useMemo(() =>
    employees.filter(emp => {
      const deptName = emp.department?.name || '';
      const compName = emp.company?.name || '';
      return [emp.name, emp.email, emp.phone, deptName, compName, emp.role, emp.status, emp.employmentType]
        .some(val => String(val || '').toLowerCase().includes(search.toLowerCase()));
    }),
    [employees, search]
  );

  // Sort
  const sorted = useMemo(() =>
    [...filtered].sort(getComparator(order, orderBy)),
    [filtered, order, orderBy]
  );

  // Paginate
  const paginated = useMemo(() =>
    sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sorted, page, rowsPerPage]
  );

  const handleSort = (colId) => {
    if (orderBy === colId) {
      setOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(colId);
      setOrder('asc');
    }
  };

  const toggleColumn = (colId) => {
    setVisibleCols(prev =>
      prev.includes(colId)
        ? prev.filter(c => c !== colId)
        : [...prev, colId]
    );
  };

  const shownColumns = ALL_COLUMNS.filter(c => visibleCols.includes(c.id));

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem' }}>
            Employee List
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', mt: 0.25 }}>
            {filtered.length} employees found
          </Typography>
        </Box>
        {canCreate && onAddClick && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddClick}
            sx={{
              backgroundColor: '#6366f1',
              color: '#ffffff',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              px: 2,
              py: 0.75,
              boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1)',
              '&:hover': {
                backgroundColor: '#4f46e5',
              },
            }}
          >
            Add Employee
          </Button>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}
      >
        {/* ── Search / Filter / Actions bar ── */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="Search by name, department, role…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: '1rem', color: '#64748b' }} />
                  </InputAdornment>
                ),
              },
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
              {ALL_COLUMNS.filter(c => c.id !== 'actions').map(col => (
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

        {/* ── Table ── */}
        <TableContainer sx={{ maxHeight: 520 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {shownColumns.map(col => (
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
                    ) : col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={shownColumns.length} align="center" sx={{ py: 6, color: '#64748b', fontSize: '0.875rem', borderBottom: '1px solid #e2e8f0' }}>
                     No employees match your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((emp, idx) => (
                  <TableRow
                    key={emp.id}
                    hover
                    sx={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      '&:hover': { backgroundColor: '#f1f5f9' },
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    {shownColumns.map(col => {
                      if (col.id === 'status') return (
                        <TableCell key={col.id} sx={{ py: 1.25, borderBottom: '1px solid #e2e8f0' }}>
                          <Chip
                            label={emp.status}
                            size="small"
                            sx={{
                              ...statusColor(emp.status),
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 22,
                              border: 'none',
                            }}
                          />
                        </TableCell>
                      );

                      if (col.id === 'phone') return (
                        <TableCell key={col.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#334155', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                          {emp.countryCode} {emp.phone}
                        </TableCell>
                      );

                      if (col.id === 'wages') return (
                        <TableCell key={col.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                          ₹{emp.wages.toLocaleString('en-IN')}{emp.employmentType === 'Daily Wages' ? '/day' : '/month'}
                        </TableCell>
                      );

                      if (col.id === 'actions') return (
                        <TableCell key={col.id} sx={{ py: 1.25, borderBottom: '1px solid #e2e8f0' }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {canEdit && <Tooltip title="Edit">
                              <IconButton onClick={() => onEditClick && onEditClick(emp)} size="small" sx={{ color: '#6366f1', '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)' } }}>
                                <EditIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>}
                            {canDelete && <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDeleteEmployee(emp.id)} sx={{ color: '#f87171', '&:hover': { backgroundColor: 'rgba(248, 113, 113, 0.08)' } }}>
                                <DeleteIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>}
                          </Box>
                        </TableCell>
                      );

                      if (col.id === 'department') return (
                        <TableCell key={col.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#334155', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                          {emp.department?.name || emp.department}
                        </TableCell>
                      );

                      return (
                        <TableCell key={col.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#334155', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                          {emp[col.id]}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
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
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
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
    </Box>
  );
};

export default EmployeeList;
