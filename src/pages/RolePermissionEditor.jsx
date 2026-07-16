import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Lock as LockIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getPermissions, getRole, updateRolePermissions } from '../services/roleService';

const PAGE_ROWS = [
  { module: 'Dashboard', label: 'Dashboard', actions: ['VIEW'] },
  { module: 'Employees', label: 'Employees', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
  { module: 'Companies', label: 'Companies', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
  { module: 'Departments', label: 'Departments', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
  { module: 'Expenses', label: 'Expenses', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
  { module: 'Employee Advances', label: 'Employee Advances', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
  { module: 'Roles & Permissions', label: 'Roles & Permissions', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
];

const ACTION_LABELS = {
  VIEW: 'Page Access',
  CREATE: 'Create',
  EDIT: 'Edit',
  DELETE: 'Delete',
};

const permissionKey = (module, action) => `${module}:${action}`;

const RolePermissionEditor = ({ role, onBack, onSaved, onDirtyChange }) => {
  const { hasPermission } = useAuth();
  const [currentRole, setCurrentRole] = useState(role);
  const [permissions, setPermissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [initialIds, setInitialIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  const isSuperAdmin = currentRole?.name?.toUpperCase() === 'SUPER_ADMIN';
  const canEdit = hasPermission('EDIT_ROLES') && !isSuperAdmin;
  const isDirty = useMemo(() => {
    if (selectedIds.size !== initialIds.size) return true;
    return [...selectedIds].some((id) => !initialIds.has(id));
  }, [selectedIds, initialIds]);

  const permissionMap = useMemo(() => {
    const map = new Map();
    permissions.forEach((permission) => {
      map.set(permissionKey(permission.module, permission.action), permission);
    });
    return map;
  }, [permissions]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [roleDetails, catalog] = await Promise.all([
          getRole(role.id),
          getPermissions(),
        ]);
        const managedCatalog = catalog.filter((permission) =>
          PAGE_ROWS.some((page) => page.module === permission.module && page.actions.includes(permission.action))
        );
        const managedIds = new Set(managedCatalog.map((permission) => permission.id));
        const selected = isSuperAdmin
          ? managedIds
          : new Set(roleDetails.permissions.filter((permission) => managedIds.has(permission.id)).map((permission) => permission.id));
        setCurrentRole(roleDetails);
        setPermissions(managedCatalog);
        setSelectedIds(selected);
        setInitialIds(new Set(selected));
      } catch (error) {
        setFeedback({ open: true, message: error.message, severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [role.id, isSuperAdmin]);

  useEffect(() => {
    const warnBeforeUnload = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const handleToggle = (page, action) => {
    if (!canEdit) return;
    const permission = permissionMap.get(permissionKey(page.module, action));
    if (!permission) return;

    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (action === 'VIEW' && next.has(permission.id)) {
        page.actions.forEach((pageAction) => {
          const pagePermission = permissionMap.get(permissionKey(page.module, pageAction));
          if (pagePermission) next.delete(pagePermission.id);
        });
      } else if (next.has(permission.id)) {
        next.delete(permission.id);
      } else {
        next.add(permission.id);
      }
      return next;
    });
  };

  const handleBack = () => {
    if (isDirty && !window.confirm('You have unsaved permission changes. Leave this page?')) return;
    onBack();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const savedRole = await updateRolePermissions(currentRole.id, [...selectedIds]);
      setCurrentRole(savedRole);
      setInitialIds(new Set(selectedIds));
      setFeedback({ open: true, message: 'Role permissions updated successfully', severity: 'success' });
      onSaved?.(savedRole);
    } catch (error) {
      setFeedback({ open: true, message: error.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('EDIT_ROLES')) {
    return <Alert severity="error">You do not have permission to manage role permissions.</Alert>;
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ color: '#475569', textTransform: 'none' }}>
            Back to Roles
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>Role Permissions</Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
              {currentRole?.name} {currentRole?.description ? `— ${currentRole.description}` : ''}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          disabled={!canEdit || !isDirty || saving || loading}
          onClick={handleSave}
          sx={{ textTransform: 'none', backgroundColor: '#4f46e5' }}
        >
          Save Changes
        </Button>
      </Box>

      {isSuperAdmin && (
        <Alert severity="info" icon={<LockIcon />} sx={{ mb: 2 }}>
          SUPER_ADMIN always has full access and cannot be modified.
        </Alert>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ p: 8, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Page</TableCell>
                {Object.values(ACTION_LABELS).map((label) => (
                  <TableCell key={label} align="center" sx={{ fontWeight: 700 }}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {PAGE_ROWS.map((page) => {
                const viewPermission = permissionMap.get(permissionKey(page.module, 'VIEW'));
                const hasPageAccess = Boolean(viewPermission && selectedIds.has(viewPermission.id));
                return (
                  <TableRow key={page.module} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: '#334155' }}>{page.label}</Typography>
                    </TableCell>
                    {Object.keys(ACTION_LABELS).map((action) => {
                      const permission = permissionMap.get(permissionKey(page.module, action));
                      if (!page.actions.includes(action) || !permission) {
                        return <TableCell key={action} align="center" sx={{ color: '#cbd5e1' }}>—</TableCell>;
                      }
                      return (
                        <TableCell key={action} align="center">
                          <Checkbox
                            checked={selectedIds.has(permission.id)}
                            disabled={!canEdit || (action !== 'VIEW' && !hasPageAccess)}
                            onChange={() => handleToggle(page, action)}
                            inputProps={{ 'aria-label': `${page.label} ${ACTION_LABELS[action]}` }}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Snackbar open={feedback.open} autoHideDuration={5000} onClose={() => setFeedback((value) => ({ ...value, open: false }))}>
        <Alert severity={feedback.severity} onClose={() => setFeedback((value) => ({ ...value, open: false }))}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RolePermissionEditor;
