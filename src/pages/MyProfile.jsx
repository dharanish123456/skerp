import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import {
  BadgeOutlined as BadgeIcon,
  BusinessOutlined as BusinessIcon,
  CalendarMonthOutlined as CalendarIcon,
  EditOutlined as EditIcon,
  EmailOutlined as EmailIcon,
  KeyOutlined as KeyIcon,
  LockOutlined as LockIcon,
  PersonOutlined as PersonIcon,
  ShieldOutlined as ShieldIcon,
  VisibilityOffOutlined as VisibilityOffIcon,
  VisibilityOutlined as VisibilityIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import SpotlightCard from '../components/SpotlightCard/SpotlightCard';

const initialsFor = (name) => String(name || 'User')
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || 'US';

const formatDate = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const InfoItem = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, p: 1, border: '1px solid #303030', borderRadius: '10px', backgroundColor: '#171717' }}>
    <Box sx={{ display: 'grid', placeItems: 'center', width: 28, height: 28, flexShrink: 0, borderRadius: '8px', color: '#f5f5f5', backgroundColor: '#303030' }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: '#a3a3a3', fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</Typography>
      <Typography noWrap sx={{ mt: 0.1, color: '#fafafa', fontSize: '0.72rem', fontWeight: 700 }}>{value || 'Not available'}</Typography>
    </Box>
  </Box>
);

const Module = ({ icon, eyebrow, title, action, children }) => (
  <Box sx={{ overflow: 'hidden', border: '1px solid #303030', borderRadius: '14px', backgroundColor: '#151515' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: { xs: 1.25, sm: 1.5 }, py: 1, borderBottom: '1px solid #303030' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'grid', placeItems: 'center', width: 28, height: 28, color: '#111111', borderRadius: '8px', backgroundColor: '#f5f5f5' }}>{icon}</Box>
        <Box>
          <Typography sx={{ color: '#8c8c8c', fontSize: '0.54rem', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{eyebrow}</Typography>
          <Typography sx={{ color: '#ffffff', fontSize: '0.78rem', fontWeight: 800 }}>{title}</Typography>
        </Box>
      </Box>
      {action}
    </Box>
    <Box sx={{ p: { xs: 1.25, sm: 1.5 } }}>{children}</Box>
  </Box>
);

const fieldSx = {
  '& .MuiOutlinedInput-root': { color: '#fafafa', backgroundColor: '#202020', borderRadius: '10px', '& fieldset': { borderColor: '#404040' }, '&:hover fieldset': { borderColor: '#737373' }, '&.Mui-focused fieldset': { borderColor: '#ffffff' } },
  '& .MuiInputLabel-root': { color: '#a3a3a3', '&.Mui-focused': { color: '#ffffff' } },
};

const MyProfile = () => {
  const { updateCurrentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [notice, setNotice] = useState({ message: '', severity: 'success' });

  useEffect(() => {
    let active = true;
    api.get('/profile')
      .then((response) => { if (active) setProfile(response.data); })
      .catch((error) => { if (active) setLoadError(error.response?.data?.message || 'Unable to load your profile.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const openEdit = () => {
    setEditForm({ fullName: profile.fullName || '', email: profile.email || '' });
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      setNotice({ message: 'Enter your full name and email address.', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const response = await api.put('/profile', editForm);
      setProfile(response.data);
      updateCurrentUser({ fullName: response.data.fullName, email: response.data.email });
      setEditOpen(false);
      setNotice({ message: 'Profile details updated.', severity: 'success' });
    } catch (error) {
      setNotice({ message: error.response?.data?.message || 'Unable to update profile details.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotice({ message: 'New password and confirmation do not match.', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.put('/profile/password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordOpen(false);
      setNotice({ message: 'Password changed successfully.', severity: 'success' });
    } catch (error) {
      setNotice({ message: error.response?.data?.message || 'Unable to change password.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center' }}><CircularProgress sx={{ color: '#111111' }} /></Box>;
  if (loadError) return <Alert severity="error">{loadError}</Alert>;
  if (!profile) return null;

  const roles = profile.roles?.length ? profile.roles : ['No role assigned'];
  const employee = profile.employee;

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto', pb: 2 }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography sx={{ color: '#1a1a1a', fontSize: { xs: '1.2rem', sm: '1.35rem' }, fontWeight: 850 }}>My Profile</Typography>
        <Typography sx={{ mt: 0.15, color: '#737373', fontSize: '0.72rem' }}>Account, work identity, and access controls.</Typography>
      </Box>

      <SpotlightCard spotlightColor="rgba(255, 255, 255, 0.13)">
        <Box sx={{ position: 'relative', overflow: 'hidden', p: { xs: 1.5, sm: 1.75 }, borderRadius: '16px', color: '#ffffff', background: 'linear-gradient(105deg, #080808, #262626)' }}>
          <Box sx={{ position: 'relative', display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.25 }}>
            <Avatar sx={{ width: 52, height: 52, fontSize: '1.1rem', fontWeight: 850, color: '#111111', background: 'linear-gradient(145deg, #ffffff, #cfcfcf)', border: '2px solid rgba(255,255,255,0.2)' }}>{initialsFor(profile.fullName)}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography component="h1" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, fontWeight: 850, lineHeight: 1.15 }}>{profile.fullName || profile.username}</Typography>
              <Typography sx={{ mt: 0.45, color: '#c7c7c7', fontSize: '0.85rem' }}>@{profile.username} · {profile.email}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.85 }}>
                <Chip label={profile.enabled ? 'Account active' : 'Account disabled'} size="small" sx={{ height: 20, color: '#111111', backgroundColor: '#ffffff', fontWeight: 800, fontSize: '0.6rem' }} />
                {roles.map((role) => <Chip key={role} label={role} size="small" variant="outlined" sx={{ height: 20, color: '#f5f5f5', borderColor: '#5a5a5a', fontWeight: 700, fontSize: '0.6rem' }} />)}
              </Box>
            </Box>
            <Button size="small" variant="contained" startIcon={<EditIcon sx={{ fontSize: 15 }} />} onClick={openEdit} sx={{ flexShrink: 0, minHeight: 30, px: 1.25, color: '#111111', backgroundColor: '#ffffff', fontWeight: 800, fontSize: '0.68rem', textTransform: 'none', borderRadius: '8px', '&:hover': { backgroundColor: '#e5e5e5' } }}>Edit profile</Button>
          </Box>
        </Box>
      </SpotlightCard>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' }, gap: 1.25, mt: 1.25 }}>
        <Module eyebrow="Identity" title="Account information" icon={<PersonIcon />}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
            <InfoItem icon={<BadgeIcon fontSize="small" />} label="Username" value={`@${profile.username}`} />
            <InfoItem icon={<EmailIcon fontSize="small" />} label="Email address" value={profile.email} />
            <InfoItem icon={<CalendarIcon fontSize="small" />} label="Member since" value={formatDate(profile.createdAt)} />
            <InfoItem icon={<ShieldIcon fontSize="small" />} label="Account status" value={profile.enabled ? 'Active and protected' : 'Disabled'} />
          </Box>
        </Module>

        <Module eyebrow="Security" title="Password & sign-in" icon={<LockIcon />} action={<Button size="small" startIcon={<KeyIcon />} onClick={() => setPasswordOpen(true)} sx={{ color: '#111111', backgroundColor: '#ffffff', borderRadius: '8px', textTransform: 'none', fontSize: '0.7rem', fontWeight: 800, '&:hover': { backgroundColor: '#e5e5e5' } }}>Change password</Button>}>
          <Typography sx={{ color: '#fafafa', fontSize: '0.76rem', fontWeight: 750 }}>Password secured</Typography>
          <Typography sx={{ mt: 0.35, color: '#a3a3a3', fontSize: '0.68rem', lineHeight: 1.45 }}>Update your password whenever you need. Changes require your current password and a new password of at least eight characters.</Typography>
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.75, color: '#bdbdbd' }}><ShieldIcon sx={{ fontSize: 14 }} /><Typography sx={{ fontSize: '0.64rem', fontWeight: 700 }}>Your current session remains protected.</Typography></Box>
        </Module>

        <Module eyebrow="Workspace" title="Work identity" icon={<WorkIcon />}>
          {employee ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
              <InfoItem icon={<BadgeIcon fontSize="small" />} label="Employee ID" value={`#${employee.id}`} />
              <InfoItem icon={<WorkIcon fontSize="small" />} label="Role" value={employee.role} />
              <InfoItem icon={<BusinessIcon fontSize="small" />} label="Company" value={employee.company} />
              <InfoItem icon={<CalendarIcon fontSize="small" />} label="Joined" value={formatDate(employee.joined)} />
              <Box sx={{ gridColumn: { xs: 'auto', sm: 'span 2' } }}><InfoItem icon={<BusinessIcon fontSize="small" />} label="Department" value={employee.department} /></Box>
            </Box>
          ) : (
            <Box sx={{ p: 1.25, border: '1px dashed #4a4a4a', borderRadius: '10px', color: '#a3a3a3' }}><Typography sx={{ color: '#fafafa', fontSize: '0.76rem', fontWeight: 750 }}>Account-only workspace</Typography><Typography sx={{ mt: 0.3, fontSize: '0.68rem', lineHeight: 1.45 }}>This account is not linked to an employee record. Your account profile and access details remain available here.</Typography></Box>
          )}
        </Module>

        <Module eyebrow="Access" title="Roles & permissions" icon={<ShieldIcon />}>
          <Typography sx={{ color: '#a3a3a3', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assigned roles</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>{roles.map((role) => <Chip key={role} label={role} size="small" sx={{ color: '#111111', backgroundColor: '#ffffff', fontSize: '0.67rem', fontWeight: 800 }} />)}</Box>
          <Typography sx={{ mt: 1.25, color: '#a3a3a3', fontSize: '0.64rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Granted capabilities</Typography>
          <Typography sx={{ mt: 0.3, color: '#fafafa', fontSize: '1rem', fontWeight: 850 }}>{profile.permissions?.length || 0}</Typography>
          <Typography sx={{ color: '#a3a3a3', fontSize: '0.68rem' }}>permissions currently assigned to your account</Typography>
        </Module>
      </Box>

      <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '18px', color: '#ffffff', backgroundColor: '#151515', border: '1px solid #363636' } }}>
        <DialogTitle sx={{ fontWeight: 850 }}>Edit profile</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <TextField fullWidth label="Full name" value={editForm.fullName} onChange={(event) => setEditForm((form) => ({ ...form, fullName: event.target.value }))} sx={{ ...fieldSx, mt: 1 }} />
          <TextField fullWidth type="email" label="Email address" value={editForm.email} onChange={(event) => setEditForm((form) => ({ ...form, email: event.target.value }))} sx={{ ...fieldSx, mt: 2 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button disabled={saving} onClick={() => setEditOpen(false)} sx={{ color: '#bdbdbd', textTransform: 'none' }}>Cancel</Button><Button disabled={saving} onClick={saveProfile} variant="contained" sx={{ backgroundColor: '#ffffff', color: '#111111', textTransform: 'none', fontWeight: 800, '&:hover': { backgroundColor: '#e5e5e5' } }}>{saving ? 'Saving…' : 'Save changes'}</Button></DialogActions>
      </Dialog>

      <Dialog open={passwordOpen} onClose={() => !saving && setPasswordOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '18px', color: '#ffffff', backgroundColor: '#151515', border: '1px solid #363636' } }}>
        <DialogTitle sx={{ fontWeight: 850 }}>Change password</DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          {[['currentPassword', 'Current password', 'current'], ['newPassword', 'New password', 'next'], ['confirmPassword', 'Confirm new password', 'confirm']].map(([key, label, visibilityKey]) => (
            <TextField key={key} fullWidth type={showPasswords[visibilityKey] ? 'text' : 'password'} label={label} value={passwordForm[key]} onChange={(event) => setPasswordForm((form) => ({ ...form, [key]: event.target.value }))} sx={{ ...fieldSx, mt: key === 'currentPassword' ? 1 : 2 }} slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={`Toggle ${label} visibility`} onClick={() => setShowPasswords((state) => ({ ...state, [visibilityKey]: !state[visibilityKey] }))} edge="end" sx={{ color: '#bdbdbd' }}>{showPasswords[visibilityKey] ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment> } }} />
          ))}
          <Typography sx={{ mt: 1.25, color: '#a3a3a3', fontSize: '0.72rem' }}>Use at least 8 characters for your new password.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button disabled={saving} onClick={() => setPasswordOpen(false)} sx={{ color: '#bdbdbd', textTransform: 'none' }}>Cancel</Button><Button disabled={saving} onClick={changePassword} variant="contained" sx={{ backgroundColor: '#ffffff', color: '#111111', textTransform: 'none', fontWeight: 800, '&:hover': { backgroundColor: '#e5e5e5' } }}>{saving ? 'Updating…' : 'Update password'}</Button></DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice.message)} autoHideDuration={4500} onClose={() => setNotice({ message: '', severity: 'success' })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert severity={notice.severity} variant="filled" onClose={() => setNotice({ message: '', severity: 'success' })}>{notice.message}</Alert></Snackbar>
    </Box>
  );
};

export default MyProfile;
