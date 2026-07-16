import { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Apartment as DepartmentIcon,
  Business as BusinessIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
  Search as SearchIcon,
  ViewColumn as ColumnIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';


const COLUMNS = [
  { id: 'id', label: 'Dept ID', sortable: true },
  { id: 'name', label: 'Department', sortable: true },
  { id: 'company', label: 'Company', sortable: true },
  { id: 'employees', label: 'Employees', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'created', label: 'Created', sortable: true },
  { id: 'actions', label: 'Actions', sortable: false },
];

const descendingComparator = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
};

const getComparator = (order, orderBy) =>
  order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);

const exportToCSV = (rows, visibleCols) => {
  const cols = visibleCols.filter((col) => col !== 'actions');
  const header = cols
    .map((col) => COLUMNS.find((column) => column.id === col)?.label)
    .join(',');
  const body = rows
    .map((row) =>
      cols
        .map((col) => {
          if (col === 'id') {
            return `"#${String(row.id).padStart(3, '0')}"`;
          }

          return `"${row[col] ?? ''}"`;
        })
        .join(',')
    )
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'departments.csv';
  link.click();
  URL.revokeObjectURL(url);
};

const statusStyles = (status) =>
  status === 'Active'
    ? { backgroundColor: '#dcfce7', color: '#15803d' }
    : { backgroundColor: '#fee2e2', color: '#b91c1c' };

const Department = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('CREATE_DEPARTMENTS');
  const canEdit = hasPermission('EDIT_DEPARTMENTS');
  const canDelete = hasPermission('DELETE_DEPARTMENTS');
  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('id');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [visibleCols, setVisibleCols] = useState([
    'id',
    'name',
    'company',
    'employees',
    'status',
    'created',
    'actions',
  ]);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };


  useEffect(() => {
    fetchDepartments();
    fetchCompanies();
  }, []);

  const filteredDepartments = useMemo(
    () =>
      departments.filter((department) => {
        const compName = department.company?.name || department.company || '';
        return [department.name, compName, department.status]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [departments, search]
  );

  const sortedDepartments = useMemo(
    () => [...filteredDepartments].sort(getComparator(order, orderBy)),
    [filteredDepartments, order, orderBy]
  );

  const paginatedDepartments = useMemo(
    () =>
      sortedDepartments.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [sortedDepartments, page, rowsPerPage]
  );

  const shownColumns = COLUMNS.filter((column) => visibleCols.includes(column.id));

  const resetDialog = () => {
    setDepartmentName('');
    setSelectedCompany('');
    setErrors({});
    setIsDialogOpen(false);
    setEditingDepartmentId(null);
  };

  const handleEditClick = (department) => {
    setEditingDepartmentId(department.id);
    setDepartmentName(department.name);
    setSelectedCompany(department.company?.id || department.companyId || '');
    setErrors({});
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!departmentName.trim()) {
      nextErrors.departmentName = 'Department name is required';
    }

    if (!selectedCompany) {
      nextErrors.company = 'Please select a company';
    }

    const duplicate = departments.some(
      (department) =>
        department.name.toLowerCase() === departmentName.trim().toLowerCase() &&
        (department.company?.id === selectedCompany || department.companyId === selectedCompany) &&
        (!editingDepartmentId || department.id !== editingDepartmentId)
    );

    if (duplicate) {
      nextErrors.departmentName = 'This department already exists for the selected company';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddDepartment = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (editingDepartmentId) {
      try {
        const response = await api.put(`/departments/${editingDepartmentId}`, {
          name: departmentName.trim(),
          companyId: Number(selectedCompany),
        });
        setDepartments((prev) => prev.map((d) => (d.id === editingDepartmentId ? response.data : d)));
        setToast({
          open: true,
          message: `Department updated successfully.`,
          severity: 'success',
        });
        resetDialog();
      } catch (error) {
        setErrors({ departmentName: error.response?.data?.message || 'Failed to update department' });
      }
    } else {
      try {
        const response = await api.post('/departments', {
          name: departmentName.trim(),
          companyId: Number(selectedCompany),
        });
        setDepartments((prev) => [response.data, ...prev]);
        setPage(0);
        setToast({
          open: true,
          message: `Department "${response.data.name}" added successfully.`,
          severity: 'success',
        });
        resetDialog();
      } catch (error) {
        setErrors({ departmentName: error.response?.data?.message || 'Failed to add department' });
      }
    }

  };

  const handleDeleteDepartment = async (id, name) => {
    try {
      await api.delete(`/departments/${id}`);
      setDepartments((prev) => prev.filter((department) => department.id !== id));
      setToast({
        open: true,
        message: `Department "${name}" removed successfully.`,
        severity: 'info',
      });
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await api.patch(`/departments/${id}/toggle-status`);
      setDepartments((prev) => prev.map((d) => (d.id === id ? response.data : d)));
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };


  const handleSort = (columnId) => {
    if (orderBy === columnId) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setOrderBy(columnId);
    setOrder('asc');
  };

  const toggleColumn = (columnId) => {
    setVisibleCols((prev) =>
      prev.includes(columnId)
        ? prev.filter((col) => col !== columnId)
        : [...prev, columnId]
    );
  };

  return (
    <Box>
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem' }}>
            Department Directory
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', mt: 0.25 }}>
            {filteredDepartments.length} departments mapped to companies
          </Typography>
        </Box>

        {canCreate && <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setErrors({});
            setIsDialogOpen(true);
          }}
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
          Add Department
        </Button>}
      </Box>

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
            placeholder="Search by department, company, status..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
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
              width: { xs: '100%', sm: 360 },
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
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExportIcon />}
              onClick={() => exportToCSV(sortedDepartments, visibleCols)}
              sx={{
                borderColor: '#cbd5e1',
                color: '#475569',
                fontSize: '0.8125rem',
                textTransform: 'none',
                backgroundColor: '#ffffff',
                '&:hover': {
                  borderColor: '#6366f1',
                  color: '#6366f1',
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                },
              }}
            >
              Export CSV
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<ColumnIcon />}
              onClick={(event) => setColumnMenuAnchor(event.currentTarget)}
              sx={{
                borderColor: '#cbd5e1',
                color: '#475569',
                fontSize: '0.8125rem',
                textTransform: 'none',
                backgroundColor: '#ffffff',
                '&:hover': {
                  borderColor: '#6366f1',
                  color: '#6366f1',
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                },
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
              {COLUMNS.filter((column) => column.id !== 'actions').map((column) => (
                <MenuItem
                  key={column.id}
                  dense
                  onClick={() => toggleColumn(column.id)}
                  sx={{ borderRadius: '6px' }}
                >
                  <FormControlLabel
                    control={(
                      <Checkbox
                        size="small"
                        checked={visibleCols.includes(column.id)}
                        sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#6366f1' }, p: 0.5 }}
                      />
                    )}
                    label={<Typography sx={{ fontSize: '0.8125rem', color: '#334155' }}>{column.label}</Typography>}
                    sx={{ m: 0, gap: 0.5 }}
                  />
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 520 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {shownColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    sortDirection={orderBy === column.id ? order : false}
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
                    {column.sortable ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleSort(column.id)}
                        sx={{
                          '&.Mui-active': { color: '#6366f1' },
                          '& .MuiTableSortLabel-icon': { color: '#6366f1 !important' },
                        }}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedDepartments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={shownColumns.length}
                    align="center"
                    sx={{ py: 6, color: '#64748b', fontSize: '0.875rem', borderBottom: '1px solid #e2e8f0' }}
                  >
                    No departments match your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDepartments.map((department, index) => (
                  <TableRow
                    key={department.id}
                    hover
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                      '&:hover': { backgroundColor: '#f1f5f9' },
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    {shownColumns.map((column) => {
                      if (column.id === 'id') {
                        return (
                          <TableCell key={column.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#64748b', fontWeight: 500, borderBottom: '1px solid #e2e8f0' }}>
                            #{String(department.id).padStart(3, '0')}
                          </TableCell>
                        );
                      }

                      if (column.id === 'name') {
                        return (
                          <TableCell key={column.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#1e293b', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DepartmentIcon sx={{ color: '#6366f1', fontSize: '1rem' }} />
                              {department.name}
                            </Box>
                          </TableCell>
                        );
                      }

                      if (column.id === 'company') {
                        return (
                          <TableCell key={column.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BusinessIcon sx={{ color: '#94a3b8', fontSize: '1rem' }} />
                              {department.company?.name || department.company}
                            </Box>
                          </TableCell>
                        );
                      }

                      if (column.id === 'employees') {
                        return (
                          <TableCell key={column.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                            {department.employees}
                          </TableCell>
                        );
                      }

                      if (column.id === 'status') {
                        return (
                          <TableCell key={column.id} sx={{ py: 1.25, borderBottom: '1px solid #e2e8f0' }}>
                            <Chip
                              label={department.status}
                              onClick={canEdit ? () => handleToggleStatus(department.id) : undefined}
                              size="small"
                              sx={{
                                ...statusStyles(department.status),
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 22,
                                border: 'none',
                                cursor: canEdit ? 'pointer' : 'default',
                                '&:hover': {
                                  opacity: 0.8,
                                },
                              }}
                            />
                          </TableCell>
                        );
                      }

                      if (column.id === 'created') {
                        return (
                          <TableCell key={column.id} sx={{ py: 1.25, fontSize: '0.8125rem', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                            {department.created}
                          </TableCell>
                        );
                      }

                      if (column.id === 'actions') {
                        return (
                          <TableCell key={column.id} sx={{ py: 1.25, borderBottom: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {canEdit && <Tooltip title="Edit Department">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditClick(department)}
                                  sx={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    '&:hover': { backgroundColor: '#f1f5f9' },
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>}
                              {canDelete && <Tooltip title="Delete Department">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteDepartment(department.id, department.name)}
                                  sx={{
                                    border: '1px solid #fee2e2',
                                    borderRadius: '6px',
                                    '&:hover': { backgroundColor: '#fef2f2' },
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>}
                            </Box>
                          </TableCell>
                        );
                      }

                      return null;
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <TablePagination
            component="div"
            count={filteredDepartments.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
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

      <Dialog
        open={isDialogOpen}
        onClose={resetDialog}
        maxWidth="sm"
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
            {editingDepartmentId ? 'Edit Department' : 'Add Department'}
          </Typography>
          <IconButton onClick={resetDialog} sx={{ color: (theme) => theme.palette.grey[500] }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleAddDepartment}>
          <DialogContent sx={{ p: 2, pt: 0 }}>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                mt: 1,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', display: 'block', mb: 0.75 }}>
                  Department Name <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <TextField
                  autoFocus
                  fullWidth
                  size="small"
                  placeholder="e.g. Procurement"
                  value={departmentName}
                  onChange={(event) => {
                    setDepartmentName(event.target.value);
                    if (errors.departmentName) {
                      setErrors((prev) => ({ ...prev, departmentName: '' }));
                    }
                  }}
                  error={Boolean(errors.departmentName)}
                  helperText={errors.departmentName}
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

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', display: 'block', mb: 0.75 }}>
                  Company <span style={{ color: '#ef4444' }}>*</span>
                </Typography>
                <FormControl fullWidth size="small" error={Boolean(errors.company)}>
                  <InputLabel id="department-company-label">Select Company</InputLabel>
                  <Select
                    labelId="department-company-label"
                    label="Select Company"
                    value={selectedCompany}
                    onChange={(event) => {
                      setSelectedCompany(event.target.value);
                      if (errors.company) {
                        setErrors((prev) => ({ ...prev, company: '' }));
                      }
                    }}
                    sx={{
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
                    }}
                  >
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {errors.company && (
                  <Typography sx={{ mt: 0.75, fontSize: '0.75rem', color: '#d32f2f' }}>
                    {errors.company}
                  </Typography>
                )}
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={resetDialog}
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
              {editingDepartmentId ? 'Save Changes' : 'Add Department'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ borderRadius: '8px', fontSize: '0.8125rem' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Department;
