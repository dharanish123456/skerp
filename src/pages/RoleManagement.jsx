import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  Security as PermissionsIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { createRole, deleteRole, getRoles, updateRole } from '../services/roleService';

const RoleManagement = ({ onManagePermissions }) => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  const canView = hasPermission('VIEW_ROLES');
  const canCreate = hasPermission('CREATE_ROLES');
  const canEdit = hasPermission('EDIT_ROLES');
  const canDelete = hasPermission('DELETE_ROLES');

  const loadRoles = async () => {
    setLoading(true);
    try {
      setRoles(await getRoles());
    } catch (error) {
      setFeedback({ open: true, message: error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return undefined;
    const loadTimer = window.setTimeout(() => loadRoles(), 0);
    return () => window.clearTimeout(loadTimer);
  }, [canView]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return roles.filter((role) =>
      role.name.toLowerCase().includes(query) || (role.description || '').toLowerCase().includes(query)
    );
  }, [roles, search]);

  const openCreate = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setDialogOpen(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || '');
    setDialogOpen(true);
  };

  const saveRole = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setFeedback({ open: true, message: 'Role name is required', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, { name, description });
      } else {
        await createRole({ name, description });
      }
      setDialogOpen(false);
      setFeedback({ open: true, message: editingRole ? 'Role updated successfully' : 'Role created successfully', severity: 'success' });
      await loadRoles();
    } catch (error) {
      setFeedback({ open: true, message: error.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteRole(deleteTarget.id);
      setDeleteTarget(null);
      setFeedback({ open: true, message: 'Role deleted successfully', severity: 'success' });
      await loadRoles();
    } catch (error) {
      setFeedback({ open: true, message: error.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!canView) {
    return <Alert severity="error">You do not have permission to view roles.</Alert>;
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>Roles & Permissions</Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>Create roles and assign page-level access.</Typography>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: 'none', backgroundColor: '#0f172a' }}>
            Create Role
          </Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <TextField
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search roles..."
          sx={{ width: { xs: '100%', sm: 360 } }}
        />
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ p: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Role Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Permissions</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRoles.map((role) => {
                const locked = role.name.toUpperCase() === 'SUPER_ADMIN';
                return (
                  <TableRow key={role.id} hover>
                    <TableCell><Typography sx={{ fontWeight: 600 }}>{role.name}</Typography></TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{role.description || '—'}</TableCell>
                    <TableCell>{role.permissions?.length || 0}</TableCell>
                    <TableCell>
                      {locked ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#94a3b8' }}>
                          <LockIcon fontSize="small" /> System Locked
                          {canEdit && (
                            <Tooltip title="View permissions">
                              <IconButton size="small" color="primary" onClick={() => onManagePermissions(role)}>
                                <PermissionsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {canEdit && (
                            <>
                              <Tooltip title="Edit role details">
                                <IconButton size="small" onClick={() => openEdit(role)}><EditIcon fontSize="small" /></IconButton>
                              </Tooltip>
                              <Tooltip title="Manage permissions">
                                <IconButton size="small" color="primary" onClick={() => onManagePermissions(role)}>
                                  <PermissionsIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {canDelete && (
                            <Tooltip title="Delete role">
                              <IconButton size="small" color="error" onClick={() => setDeleteTarget(role)}><DeleteIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!filteredRoles.length && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>No roles found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={saveRole}>
          <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField label="Role Name" value={name} onChange={(event) => setName(event.target.value)} required disabled={saving} />
            <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={2} disabled={saving} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !saving && setDeleteTarget(null)}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>Delete the role <strong>{deleteTarget?.name}</strong>? This cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={saving}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={feedback.open} autoHideDuration={5000} onClose={() => setFeedback((value) => ({ ...value, open: false }))}>
        <Alert severity={feedback.severity} onClose={() => setFeedback((value) => ({ ...value, open: false }))}>{feedback.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default RoleManagement;
