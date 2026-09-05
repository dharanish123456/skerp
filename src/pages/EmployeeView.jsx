import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AccountBalanceOutlined as BankIcon,
  ArrowBack as ArrowBackIcon,
  BadgeOutlined as BadgeIcon,
  BusinessOutlined as BusinessIcon,
  CalendarMonthOutlined as CalendarIcon,
  DescriptionOutlined as DocumentIcon,
  EditOutlined as EditIcon,
  EmailOutlined as EmailIcon,
  HomeOutlined as HomeIcon,
  LocationOnOutlined as LocationIcon,
  PaymentsOutlined as PaymentsIcon,
  PersonOutlined as PersonIcon,
  PhoneOutlined as PhoneIcon,
  ShieldOutlined as ShieldIcon,
  VisibilityOffOutlined as HideIcon,
  VisibilityOutlined as ViewIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import api from '../config/api';
import SpotlightCard from '../components/SpotlightCard/SpotlightCard';
import PillTabNav from '../components/PillTabNav/PillTabNav';

const EMPTY_VALUE = 'Not provided';

const PROFILE_TABS = [
  { label: 'Overview', value: 0 },
  { label: 'Employment', value: 1 },
  { label: 'Compliance & Bank', value: 2 },
  { label: 'Documents', value: 3 },
];

const statusColor = (status) => {
  switch (status) {
    case 'Active': return { backgroundColor: '#111111', color: '#ffffff' };
    case 'Inactive': return { backgroundColor: '#d4d4d4', color: '#111111' };
    case 'On Leave': return { backgroundColor: '#e5e5e5', color: '#111111' };
    default: return { backgroundColor: '#e5e5e5', color: '#262626' };
  }
};

const displayValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return EMPTY_VALUE;
  return String(value);
};

const formatDate = (value) => {
  if (!value) return EMPTY_VALUE;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return displayValue(value);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return EMPTY_VALUE;
  const amount = Number(value);
  if (Number.isNaN(amount)) return displayValue(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const initialsFor = (name) => {
  const parts = String(name || 'Employee').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'E';
};

const maskEnding = (value, label, visible = 4) => {
  const text = String(value || '').replace(/\s/g, '');
  if (!text) return EMPTY_VALUE;
  const ending = text.slice(-visible);
  return `${label} ${ending}`;
};

const maskPan = (value) => {
  const text = String(value || '').trim();
  if (!text) return EMPTY_VALUE;
  if (text.length < 5) return '•••••';
  return `${text.slice(0, 2)}••••••${text.slice(-2)}`;
};

const DetailItem = ({ icon, label, value, fullWidth = false, action }) => (
  <Grid xs={12} sm={fullWidth ? 12 : 6}>
    <Box
      sx={{
        display: 'flex',
        alignItems: fullWidth ? 'flex-start' : 'center',
        gap: 1.5,
        minHeight: 62,
        p: 1.5,
        borderRadius: '12px',
        backgroundColor: '#f8fafc',
        border: '1px solid #eef2f7',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: '10px',
          color: '#111111',
          backgroundColor: '#f1f1f1',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </Typography>
        <Typography sx={{ mt: 0.25, fontSize: '0.875rem', fontWeight: 600, color: value === EMPTY_VALUE ? '#94a3b8' : '#334155', overflowWrap: 'anywhere' }}>
          {value}
        </Typography>
      </Box>
      {action}
    </Box>
  </Grid>
);

const SectionCard = ({ title, subtitle, icon, children }) => (
  <Box sx={{ borderRadius: '16px' }}>
    <SpotlightCard>
      <Box sx={{ p: { xs: 2, sm: 2.5 }, backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
          <Box sx={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: '12px', color: '#ffffff', backgroundColor: '#111111' }}>
            {icon}
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>{title}</Typography>
            {subtitle && <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{subtitle}</Typography>}
          </Box>
        </Box>
        <Grid container spacing={1.5}>{children}</Grid>
      </Box>
    </SpotlightCard>
  </Box>
);

const SensitiveAction = ({ label, revealed, onToggle }) => (
  <Tooltip title={`${revealed ? 'Hide' : 'Reveal'} ${label}`}>
    <IconButton
      size="small"
      aria-label={`${revealed ? 'Hide' : 'Reveal'} ${label}`}
      onClick={onToggle}
      sx={{ color: '#525252', '&:hover': { color: '#111111', backgroundColor: '#f1f1f1' } }}
    >
      {revealed ? <HideIcon fontSize="small" /> : <ViewIcon fontSize="small" />}
    </IconButton>
  </Tooltip>
);

const EmployeeView = ({ employee, onBack, onEdit }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [revealed, setRevealed] = useState({});
  const [documentError, setDocumentError] = useState('');
  const [openingDocument, setOpeningDocument] = useState('');

  const fullPhone = useMemo(() => {
    const phone = displayValue(employee?.phone);
    if (phone === EMPTY_VALUE) return phone;
    return `${employee?.countryCode || ''} ${phone}`.trim();
  }, [employee?.countryCode, employee?.phone]);

  if (!employee) return null;

  const toggleReveal = (key) => setRevealed((current) => ({ ...current, [key]: !current[key] }));
  const sensitiveAction = (key, label) => (
    <SensitiveAction label={label} revealed={Boolean(revealed[key])} onToggle={() => toggleReveal(key)} />
  );

  const handleOpenDocument = async (filename, label) => {
    if (!filename || openingDocument) return;
    const previewWindow = window.open('', '_blank');
    setOpeningDocument(filename);
    setDocumentError('');

    try {
      const response = await api.get(`/employees/proofs/${encodeURIComponent(filename)}`, { responseType: 'blob' });
      const objectUrl = URL.createObjectURL(response.data);
      if (previewWindow) {
        previewWindow.location.href = objectUrl;
      } else {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (error) {
      previewWindow?.close();
      setDocumentError(error.response?.status === 404 ? `${label} was not found.` : `Unable to open ${label}. Please try again.`);
    } finally {
      setOpeningDocument('');
    }
  };

  const documents = [
    { key: 'aadhaar', label: 'Aadhaar Proof', filename: employee.aadhaarProof },
    { key: 'pan', label: 'PAN Proof', filename: employee.panProof },
    { key: 'insurance', label: 'Insurance Proof', filename: employee.insuranceProof },
  ];

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', pb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ color: '#475569', textTransform: 'none', fontWeight: 700 }}>
          Back to employees
        </Button>
        {onEdit && (
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => onEdit(employee)} sx={{ backgroundColor: '#111111', textTransform: 'none', fontWeight: 700, borderRadius: '10px', boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)', '&:hover': { backgroundColor: '#262626' } }}>
            Edit employee
          </Button>
        )}
      </Box>

      <Box sx={{ overflow: 'hidden', mb: 2, border: '1px solid #dedede', borderRadius: '14px', backgroundColor: '#ffffff', boxShadow: '0 6px 18px rgba(0, 0, 0, 0.04)' }}>
          <Box
            sx={{
              position: 'relative',
              overflow: 'hidden',
              p: { xs: 1.25, sm: 1.5 },
              color: '#111111',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 1.5 } }}>
              <Avatar sx={{ width: { xs: 44, sm: 48 }, height: { xs: 44, sm: 48 }, flexShrink: 0, fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: 850, color: '#111111', background: 'linear-gradient(145deg, #ffffff, #e5e5e5)', border: '1px solid #d4d4d4' }}>
                {initialsFor(employee.name)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mb: 0.15 }}>
                  <Typography component="h1" sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' }, lineHeight: 1.2, fontWeight: 850, color: '#111111' }}>
                    {displayValue(employee.name)}
                  </Typography>
                  <Chip label={displayValue(employee.status)} size="small" sx={{ ...statusColor(employee.status), height: 20, fontSize: '0.62rem', fontWeight: 800 }} />
                </Box>
                  <Typography sx={{ color: '#525252', fontSize: { xs: '0.7rem', sm: '0.75rem' }, fontWeight: 650 }}>
                  Employee #{employee.id} · {displayValue(employee.role)}
                </Typography>
              </Box>
            </Box>
          </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, borderTop: '1px solid #e5e5e5', backgroundColor: '#fafafa' }}>
          {[
            { label: 'Company', value: displayValue(employee.company?.name || employee.company), icon: <BusinessIcon fontSize="small" /> },
            { label: 'Department', value: displayValue(employee.department?.name || employee.department), icon: <WorkIcon fontSize="small" /> },
            { label: 'Joined', value: formatDate(employee.joined), icon: <CalendarIcon fontSize="small" /> },
          ].map((detail, index) => (
            <Box key={detail.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, px: { xs: 1.5, sm: 2 }, py: 0.85, borderRight: { xs: 0, sm: index < 2 ? '1px solid #e5e5e5' : 0 }, borderBottom: { xs: index < 2 ? '1px solid #e5e5e5' : 0, sm: 0 } }}>
              <Box sx={{ display: 'grid', placeItems: 'center', width: 26, height: 26, flexShrink: 0, color: '#404040', backgroundColor: '#e5e5e5', borderRadius: '7px' }}>{detail.icon}</Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: '#737373', fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{detail.label}</Typography>
                <Typography noWrap sx={{ color: '#111111', fontSize: '0.7rem', fontWeight: 750 }}>{detail.value}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
        <PillTabNav
          items={PROFILE_TABS}
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel="Employee profile sections"
        />
      </Box>

      {activeTab === 0 && (
        <SectionCard title="Personal information" subtitle="Contact and personal details" icon={<PersonIcon />}>
          <DetailItem icon={<EmailIcon fontSize="small" />} label="Email" value={displayValue(employee.email)} />
          <DetailItem icon={<PhoneIcon fontSize="small" />} label="Phone" value={fullPhone} />
          <DetailItem icon={<CalendarIcon fontSize="small" />} label="Date of birth" value={formatDate(employee.dob)} />
          <DetailItem icon={<BadgeIcon fontSize="small" />} label="Gender" value={displayValue(employee.gender)} />
          <DetailItem icon={<LocationIcon fontSize="small" />} label="State" value={displayValue(employee.state)} />
          <DetailItem icon={<LocationIcon fontSize="small" />} label="District" value={displayValue(employee.district)} />
          <DetailItem fullWidth icon={<HomeIcon fontSize="small" />} label="Address" value={displayValue(employee.address)} />
        </SectionCard>
      )}

      {activeTab === 1 && (
        <SectionCard title="Employment details" subtitle="Role, organization, and compensation" icon={<WorkIcon />}>
          <DetailItem icon={<BusinessIcon fontSize="small" />} label="Company" value={displayValue(employee.company?.name || employee.company)} />
          <DetailItem icon={<WorkIcon fontSize="small" />} label="Department" value={displayValue(employee.department?.name || employee.department)} />
          <DetailItem icon={<BadgeIcon fontSize="small" />} label="Role" value={displayValue(employee.role)} />
          <DetailItem icon={<PersonIcon fontSize="small" />} label="Employment type" value={displayValue(employee.employmentType)} />
          <DetailItem icon={<CalendarIcon fontSize="small" />} label="Joined date" value={formatDate(employee.joined)} />
          <DetailItem icon={<ShieldIcon fontSize="small" />} label="Status" value={displayValue(employee.status)} />
          <DetailItem fullWidth icon={<PaymentsIcon fontSize="small" />} label="Wages / Salary" value={revealed.wages ? formatCurrency(employee.wages) : (employee.wages ? '••••••••' : EMPTY_VALUE)} action={employee.wages ? sensitiveAction('wages', 'wages or salary') : null} />
        </SectionCard>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          <Grid xs={12} lg={6}>
            <SectionCard title="Compliance" subtitle="Government and insurance identifiers" icon={<ShieldIcon />}>
              <DetailItem icon={<BadgeIcon fontSize="small" />} label="Aadhaar" value={revealed.aadhaar ? displayValue(employee.aadhaar) : maskEnding(employee.aadhaar, '•••• ••••')} action={employee.aadhaar ? sensitiveAction('aadhaar', 'Aadhaar number') : null} />
              <DetailItem icon={<BadgeIcon fontSize="small" />} label="PAN" value={revealed.pan ? displayValue(employee.pan) : maskPan(employee.pan)} action={employee.pan ? sensitiveAction('pan', 'PAN number') : null} />
              <DetailItem icon={<ShieldIcon fontSize="small" />} label="ESIC" value={displayValue(employee.esic)} />
              <DetailItem icon={<ShieldIcon fontSize="small" />} label="Insurance" value={displayValue(employee.insurance)} />
            </SectionCard>
          </Grid>
          <Grid xs={12} lg={6}>
            <SectionCard title="Bank information" subtitle="Salary payment account" icon={<BankIcon />}>
              <DetailItem icon={<BankIcon fontSize="small" />} label="Bank name" value={displayValue(employee.bankName)} />
              <DetailItem icon={<BadgeIcon fontSize="small" />} label="Account number" value={revealed.account ? displayValue(employee.accountNumber) : maskEnding(employee.accountNumber, '••••••')} action={employee.accountNumber ? sensitiveAction('account', 'bank account number') : null} />
              <DetailItem fullWidth icon={<BankIcon fontSize="small" />} label="IFSC" value={displayValue(employee.ifsc)} />
            </SectionCard>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Box sx={{ borderRadius: '16px' }}>
          <SpotlightCard>
            <Box sx={{ p: { xs: 2, sm: 2.5 }, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                <Box sx={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: '12px', color: '#ffffff', backgroundColor: '#111111' }}><DocumentIcon /></Box>
                <Box><Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>Proof documents</Typography><Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Securely stored employee files</Typography></Box>
              </Box>
              <Grid container spacing={1.5}>
                {documents.map((document) => {
                  const available = Boolean(document.filename);
                  return (
                    <Grid xs={12} md={4} key={document.key}>
                      <Box sx={{ height: '100%', p: 2, borderRadius: '14px', border: `1px solid ${available ? '#bdbdbd' : '#e5e5e5'}`, backgroundColor: available ? '#fafafa' : '#f5f5f5' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                          <Box sx={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: '12px', color: available ? '#111111' : '#737373', backgroundColor: available ? '#e5e5e5' : '#e5e5e5' }}><DocumentIcon /></Box>
                          <Chip label={available ? 'Available' : 'Missing'} size="small" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 800, backgroundColor: available ? '#111111' : '#e5e5e5', color: available ? '#ffffff' : '#525252' }} />
                        </Box>
                        <Typography sx={{ mt: 1.5, fontSize: '0.875rem', fontWeight: 800, color: '#334155' }}>{document.label}</Typography>
                        <Typography noWrap sx={{ mt: 0.25, fontSize: '0.72rem', color: '#64748b' }}>{available ? document.filename : 'No file uploaded'}</Typography>
                        <Button fullWidth variant={available ? 'contained' : 'outlined'} disabled={!available || Boolean(openingDocument)} startIcon={<ViewIcon />} onClick={() => handleOpenDocument(document.filename, document.label)} sx={{ mt: 1.75, textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, borderRadius: '9px', backgroundColor: available ? '#111111' : undefined, '&:hover': { backgroundColor: available ? '#262626' : undefined } }}>
                          {openingDocument === document.filename ? 'Opening…' : 'View document'}
                        </Button>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </SpotlightCard>
        </Box>
      )}

      <Snackbar open={Boolean(documentError)} autoHideDuration={5000} onClose={() => setDocumentError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" variant="filled" onClose={() => setDocumentError('')}>{documentError}</Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeView;
