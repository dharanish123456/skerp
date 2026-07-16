import { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  InputAdornment,
  Snackbar,
  Alert,
  IconButton,
  Divider,
  Chip,
  Tabs,
  Tab,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  AccountBalance as BankIcon,
  Description as DocIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { useIndianStates } from '../hooks/useIndianStates';
import { useCountryCodes } from '../hooks/useCountryCodes';
import { usePhoneValidation } from '../hooks/usePhoneValidation';
import { useCompanyDepartments } from '../hooks/useCompanyDepartments';
import api from '../config/api';



// Session storage key
const DRAFT_STORAGE_KEY = 'add-employee-draft';

// ──────────────────────────────────────────────────────────────
// Helper: combine phone code + number
const combinePhoneValue = (code, number) => {
  const normalizedNumber = String(number || '').replace(/\D/g, '').trim();
  const normalizedCode = String(code || '+91').trim();
  return normalizedNumber ? `${normalizedCode} ${normalizedNumber}` : normalizedCode;
};

// ──────────────────────────────────────────────────────────────
// Reusable FormField component (two‑column by default)
const FormField = ({ label, required, children, fullWidth = false }) => (
  <Grid item xs={12} md={fullWidth ? 12 : 6}>
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" component="label" sx={{ fontWeight: 600, color: '#475569', display: 'block', mb: 0.5 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </Typography>
      {children}
    </Box>
  </Grid>
);

// Reusable file upload with preview
const FileUploadField = ({ label, file, existingFile, onFileChange, onRemove, error, required = false }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (file && file.type?.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) {
      onFileChange(f);
    }
  };

  // Extract filename from a path string
  const getFileName = (path) => {
    if (!path) return '';
    return path.split('/').pop().split('\\').pop();
  };

  const hasFile = !!file;
  const hasExisting = !file && !!existingFile;

  return (
    <Box>
      {label && (
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 0.5, display: 'block' }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </Typography>
      )}
      {hasFile ? (
        /* New file selected by user */
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#fefce8' }}>
          {preview ? (
            <Avatar src={preview} variant="rounded" sx={{ width: 48, height: 48 }} />
          ) : (
            <FileIcon sx={{ fontSize: 32, color: '#475569' }} />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap>{file.name}</Typography>
            <Typography variant="caption" color="textSecondary">
              {(file.size / 1024).toFixed(1)} KB
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => { const url = URL.createObjectURL(file); window.open(url, '_blank'); }} color="primary" title="View file">
            <PreviewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onRemove()} color="error" title="Remove file">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : hasExisting ? (
        /* Existing file from server (edit mode) */
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid #a7f3d0', borderRadius: 2, bgcolor: '#ecfdf5' }}>
          <FileIcon sx={{ fontSize: 32, color: '#059669' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ color: '#065f46' }}>{getFileName(existingFile)}</Typography>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 500 }}>
              ✓ Already uploaded
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => window.open(`${API_BASE_URL}/employees/proofs/${existingFile}`, '_blank')}
            color="primary"
            title="View file"
          >
            <PreviewIcon fontSize="small" />
          </IconButton>
          <Button
            size="small"
            variant="outlined"
            onClick={() => inputRef.current.click()}
            sx={{ textTransform: 'none', fontSize: '0.75rem', borderColor: '#6366f1', color: '#6366f1' }}
          >
            Replace
          </Button>
        </Box>
      ) : (
        /* No file at all — show upload zone */
        <Box
          onClick={() => inputRef.current.click()}
          sx={{
            border: `2px dashed ${error ? '#ef4444' : '#cbd5e1'}`,
            borderRadius: 2,
            p: 2,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: error ? '#fef2f2' : '#f8fafc',
            transition: 'all 0.2s',
            '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.02)' },
          }}
        >
          <UploadIcon sx={{ fontSize: 28, color: error ? '#f87171' : '#6366f1', mb: 0.5 }} />
          <Typography variant="caption" display="block" color="textSecondary">
            Click to upload (JPG, PNG, PDF)
          </Typography>
        </Box>
      )}
      <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} accept="image/*,.pdf" />
      {error && <FormHelperText error sx={{ mx: 0 }}>{error}</FormHelperText>}
    </Box>
  );
};

// ──────────────────────────────────────────────────────────────
// Main Component
const AddEmployee = ({ onCancel, onSuccess, employee }) => {
  const { states, getDistrictsForState } = useIndianStates();
  const { countryCodes, getPhoneConfig } = useCountryCodes();
  const { validatePhone } = usePhoneValidation();
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Personal Details', 'Employment Details', 'Compliance & Bank'];

  // Form data state
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    countryCode: employee?.countryCode || '+91',
    phone: employee?.phone || '',
    dob: employee?.dob ? dayjs(employee.dob) : null,
    gender: employee?.gender || 'Male',
    state: employee?.state || '',
    district: employee?.district || '',
    address: employee?.address || '',
    companyId: employee?.company?.id || employee?.companyId || '',
    departmentId: employee?.department?.id || employee?.departmentId || '',
    role: employee?.role || '',
    joined: employee?.joined ? dayjs(employee.joined) : dayjs(),
    employmentType: employee?.employmentType || 'Daily Wages',
    wages: employee?.wages || '',
    status: employee?.status || 'Active',
    aadhaar: employee?.aadhaar || '',
    pan: employee?.pan || '',
    esic: employee?.esic || '',
    insurance: employee?.insurance || '',
    accountNumber: employee?.accountNumber || '',
    ifsc: employee?.ifsc || '',
    bankName: employee?.bankName || '',
  });

  const {
    companies,
    departments,
    handleCompanyChange,
    handleDepartmentChange
  } = useCompanyDepartments(formData.companyId, formData.departmentId);

  const [files, setFiles] = useState({
    aadhaarProof: null,
    panProof: null,
    insuranceProof: null,
  });

  const [errors, setErrors] = useState({});
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [loading, setLoading] = useState(false);

  // ── Load draft from session storage on mount ──
  useEffect(() => {
    if (employee) return; // Skip draft loading in edit mode
    const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData({
          ...parsed.formData,
          dob: parsed.formData.dob ? dayjs(parsed.formData.dob) : null,
          joined: parsed.formData.joined ? dayjs(parsed.formData.joined) : dayjs(),
        });
        setFiles(parsed.files || { aadhaarProof: null, panProof: null, insuranceProof: null });
        setActiveTab(parsed.activeTab || 0);
      } catch (e) {}
    }
  }, [employee]);

  // ── Auto‑save draft to session storage on any change (debounced) ──
  useEffect(() => {
    if (employee) return; // Skip draft autosave in edit mode
    const timer = setTimeout(() => {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        formData: {
          ...formData,
          dob: formData.dob?.toISOString(),
          joined: formData.joined?.toISOString(),
        },
        files,
        activeTab,
      }));
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, files, activeTab, employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const config = getPhoneConfig(formData.countryCode);
      const sanitized = value.replace(/\D/g, '').slice(0, config.maxLength);
      setFormData((prev) => ({ ...prev, phone: sanitized }));
      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
    } else if (name === 'countryCode') {
      const config = getPhoneConfig(value);
      setFormData((prev) => ({
        ...prev,
        countryCode: value,
        phone: prev.phone.replace(/\D/g, '').slice(0, config.maxLength)
      }));
      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (key, file) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const removeFile = (key) => setFiles((prev) => ({ ...prev, [key]: null }));

  // ── Tab validation (only required fields per tab) ──
  const validateTab = (tabIndex) => {
    const newErrors = {};
    if (tabIndex === 0) {
      if (!formData.name.trim()) newErrors.name = 'Full Name required';
      const phoneError = validatePhone(formData.countryCode, formData.phone);
      if (phoneError) newErrors.phone = phoneError;
      if (!formData.dob) newErrors.dob = 'Date of Birth required';
      if (!formData.state) newErrors.state = 'State required';
      if (!formData.district) newErrors.district = 'District required';
      if (!formData.address.trim()) newErrors.address = 'Address required';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = 'Invalid email';
    } else if (tabIndex === 1) {
      if (!formData.companyId) newErrors.companyId = 'Company required';
      if (!formData.departmentId) newErrors.departmentId = 'Department required';
      if (!formData.role.trim()) newErrors.role = 'Designation required';
      if (!formData.wages) newErrors.wages = 'Daily wages required';
      else if (isNaN(formData.wages) || Number(formData.wages) <= 0) newErrors.wages = 'Must be positive';
    } else if (tabIndex === 2) {
      if (!formData.aadhaar.trim()) newErrors.aadhaar = 'Aadhaar required';
      else if (!/^\d{12}$/.test(formData.aadhaar.trim())) newErrors.aadhaar = '12 digits';
      if (!formData.pan.trim()) newErrors.pan = 'PAN required';
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.trim().toUpperCase()))
        newErrors.pan = 'Format: ABCDE1234F';
      if (!formData.esic.trim()) newErrors.esic = 'ESIC required';
      if (!formData.insurance.trim()) newErrors.insurance = 'Insurance required';
      if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number required';
      if (!formData.ifsc.trim()) newErrors.ifsc = 'IFSC required';
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc.trim().toUpperCase()))
        newErrors.ifsc = 'Format: SBIN0012345';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTabChange = (event, newValue) => {
    // Validate current tab before moving forward
    if (newValue > activeTab) {
      if (!validateTab(activeTab)) {
        setSnackbarMessage(`Please complete all required fields in "${tabs[activeTab]}" before proceeding.`);
        setSnackbarSeverity('error');
        setShowSnackbar(true);
        return;
      }
    }
    setActiveTab(newValue);
  };

  // ── Final submission ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all tabs
    for (let i = 0; i < tabs.length; i++) {
      if (!validateTab(i)) {
        setActiveTab(i);
        setSnackbarMessage(`Please fill all required fields in "${tabs[i]}"`);
        setSnackbarSeverity('error');
        setShowSnackbar(true);
        return;
      }
    }

    setLoading(true);
    try {
      // Build FormData for multipart upload
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('email', formData.email || '');
      fd.append('countryCode', formData.countryCode || '+91');
      fd.append('phone', formData.phone);
      fd.append('dob', formData.dob?.format('YYYY-MM-DD') || '');
      fd.append('gender', formData.gender);
      fd.append('state', formData.state);
      fd.append('district', formData.district);
      fd.append('address', formData.address);
      fd.append('companyId', String(formData.companyId));
      fd.append('departmentId', String(formData.departmentId));
      fd.append('role', formData.role);
      fd.append('joined', formData.joined?.format('YYYY-MM-DD') || '');
      fd.append('employmentType', formData.employmentType);
      fd.append('wages', String(formData.wages));
      fd.append('status', formData.status || 'Active');
      fd.append('aadhaar', formData.aadhaar);
      fd.append('pan', formData.pan);
      fd.append('esic', formData.esic || '');
      fd.append('insurance', formData.insurance || '');
      fd.append('accountNumber', formData.accountNumber);
      fd.append('ifsc', formData.ifsc);
      fd.append('bankName', formData.bankName || '');

      // Attach proof files if selected
      if (files.aadhaarProof) fd.append('aadhaarProofFile', files.aadhaarProof);
      if (files.panProof) fd.append('panProofFile', files.panProof);
      if (files.insuranceProof) fd.append('insuranceProofFile', files.insuranceProof);

      const url = employee?.id
        ? `/employees/${employee.id}`
        : `/employees`;

      const response = employee?.id
        ? await api.put(url, fd)
        : await api.post(url, fd);

      setSnackbarMessage(employee?.id ? 'Employee updated successfully!' : 'Employee registered successfully!');
      setSnackbarSeverity('success');
      setShowSnackbar(true);
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else if (onCancel) onCancel();
      }, 1500);

    } catch (err) {
      setSnackbarMessage('Registration failed. Connection error.');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ pb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={onCancel} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight="bold">{employee?.id ? 'Edit Employee' : 'Add New Employee'}</Typography>
              <Typography variant="body2" color="textSecondary">Fill all mandatory fields (*)</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" startIcon={<CloseIcon />} onClick={onCancel}>Discard</Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : (employee?.id ? 'Update Employee' : 'Save Employee')}
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }} elevation={0} variant="outlined">
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            {tabs.map((label, idx) => (
              <Tab key={idx} label={label} sx={{ textTransform: 'none', fontWeight: 500 }} />
            ))}
          </Tabs>
        </Paper>

        {/* Form body */}
        <form noValidate>
          {/* Tab 0: Personal Details */}
          {activeTab === 0 && (
            <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0} variant="outlined">
              <Grid container spacing={2}>
                <FormField label="Full Name" required>
                  <TextField fullWidth size="small" name="name" value={formData.name} onChange={handleChange} error={!!errors.name} helperText={errors.name} />
                </FormField>
                <FormField label="Email Address">
                  <TextField fullWidth size="small" name="email" value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email || 'Optional'} />
                </FormField>
                <FormField label="Phone Number" required fullWidth>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Select
                      value={formData.countryCode}
                      onChange={(e) => handleChange({ target: { name: 'countryCode', value: e.target.value } })}
                      size="small"
                      sx={{ width: 110 }}
                    >
                      {countryCodes.map(c => <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>)}
                    </Select>
                    <TextField
                      fullWidth
                      size="small"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      error={!!errors.phone}
                      helperText={errors.phone}
                      placeholder={`${getPhoneConfig(formData.countryCode).maxLength}-digit number`}
                      inputProps={{ maxLength: getPhoneConfig(formData.countryCode).maxLength }}
                    />
                  </Box>
                </FormField>
                <FormField label="Date of Birth" required>
                  <DatePicker
                    value={formData.dob}
                    onChange={(val) => handleDateChange('dob', val)}
                    format="DD/MM/YYYY"
                    maxDate={dayjs()}
                    slotProps={{ textField: { size: 'small', fullWidth: true, error: !!errors.dob, helperText: errors.dob } }}
                  />
                </FormField>
                <FormField label="Gender">
                  <Select fullWidth size="small" name="gender" value={formData.gender} onChange={handleChange}>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormField>
                <FormField label="State" required>
                  <Select
                    fullWidth size="small"
                    name="state"
                    value={formData.state}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, district: '' }));
                    }}
                    error={!!errors.state}
                  >
                    {states.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                  {errors.state && <FormHelperText error>{errors.state}</FormHelperText>}
                </FormField>
                <FormField label="District" required>
                  <Select
                    fullWidth size="small"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    disabled={!formData.state}
                    error={!!errors.district}
                  >
                    {formData.state && getDistrictsForState(formData.state).map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                  {errors.district && <FormHelperText error>{errors.district}</FormHelperText>}
                </FormField>
                <FormField label="Street Address" required fullWidth>
                  <TextField fullWidth size="small" multiline rows={2} name="address" value={formData.address} onChange={handleChange} error={!!errors.address} helperText={errors.address} />
                </FormField>
              </Grid>
            </Paper>
          )}

          {/* Tab 1: Employment Details */}
          {activeTab === 1 && (
            <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0} variant="outlined">
              <Grid container spacing={2}>
                <FormField label="Company" required>
                  <Select
                    fullWidth
                    size="small"
                    name="companyId"
                    value={formData.companyId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      handleCompanyChange(cid);
                      setFormData(prev => ({
                        ...prev,
                        companyId: cid,
                        departmentId: ''
                      }));
                    }}
                    error={!!errors.companyId}
                  >
                    {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                  {errors.companyId && <FormHelperText error>{errors.companyId}</FormHelperText>}
                </FormField>

                <FormField label="Department" required>
                  <Select
                    fullWidth
                    size="small"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={(e) => {
                      const did = e.target.value;
                      handleDepartmentChange(did);
                      setFormData(prev => ({
                        ...prev,
                        departmentId: did
                      }));
                    }}
                    disabled={!formData.companyId}
                    error={!!errors.departmentId}
                  >
                    {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                  </Select>
                  {errors.departmentId && <FormHelperText error>{errors.departmentId}</FormHelperText>}
                </FormField>
                <FormField label="Designation / Role" required>
                  <TextField fullWidth size="small" name="role" value={formData.role} onChange={handleChange} error={!!errors.role} helperText={errors.role} />
                </FormField>
                <FormField label="Date of Joining">
                  <DatePicker
                    value={formData.joined}
                    onChange={(val) => handleDateChange('joined', val)}
                    format="DD/MM/YYYY"
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </FormField>
                <FormField label="Employment Type">
                  <Select fullWidth size="small" name="employmentType" value={formData.employmentType} onChange={handleChange}>
                    <MenuItem value="Daily Wages">Daily Wages</MenuItem>
                    <MenuItem value="Full-time">Full-time</MenuItem>
                    <MenuItem value="Part-time">Part-time</MenuItem>
                    <MenuItem value="Contract">Contract</MenuItem>
                    <MenuItem value="Intern">Intern</MenuItem>
                  </Select>
                </FormField>
                <FormField label="Daily Wages (₹)" required>
                  <TextField fullWidth size="small" name="wages" value={formData.wages} onChange={handleChange} error={!!errors.wages} helperText={errors.wages} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                </FormField>
                <FormField label="Status">
                  <Select fullWidth size="small" name="status" value={formData.status} onChange={handleChange}>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="On Leave">On Leave</MenuItem>
                  </Select>
                </FormField>
              </Grid>
            </Paper>
          )}

          {/* Tab 2: Compliance & Bank */}
          {activeTab === 2 && (
            <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0} variant="outlined">
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>Aadhaar Details</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <FormField label="Aadhaar Number" required>
                  <TextField fullWidth size="small" name="aadhaar" value={formData.aadhaar} onChange={handleChange} error={!!errors.aadhaar} helperText={errors.aadhaar} inputProps={{ maxLength: 12 }} />
                </FormField>
                <FormField label="Upload Aadhaar Copy" fullWidth>
                  <FileUploadField
                    file={files.aadhaarProof}
                    existingFile={employee?.aadhaarProof}
                    onFileChange={(f) => handleFileChange('aadhaarProof', f)}
                    onRemove={() => removeFile('aadhaarProof')}
                    error={errors.aadhaarProof}
                  />
                </FormField>
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>PAN Details</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <FormField label="PAN Number" required>
                  <TextField fullWidth size="small" name="pan" value={formData.pan} onChange={handleChange} error={!!errors.pan} helperText={errors.pan} inputProps={{ maxLength: 10 }} />
                </FormField>
                <FormField label="Upload PAN Copy" fullWidth>
                  <FileUploadField
                    file={files.panProof}
                    existingFile={employee?.panProof}
                    onFileChange={(f) => handleFileChange('panProof', f)}
                    onRemove={() => removeFile('panProof')}
                    error={errors.panProof}
                  />
                </FormField>
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>ESIC & Insurance</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <FormField label="ESIC Number" required>
                  <TextField fullWidth size="small" name="esic" value={formData.esic} onChange={handleChange} error={!!errors.esic} helperText={errors.esic} />
                </FormField>
                <FormField label="Insurance Number" required>
                  <TextField fullWidth size="small" name="insurance" value={formData.insurance} onChange={handleChange} error={!!errors.insurance} helperText={errors.insurance} />
                </FormField>
                <FormField label="Insurance/ESIC Document" fullWidth>
                  <FileUploadField
                    file={files.insuranceProof}
                    existingFile={employee?.insuranceProof}
                    onFileChange={(f) => handleFileChange('insuranceProof', f)}
                    onRemove={() => removeFile('insuranceProof')}
                    error={errors.insuranceProof}
                  />
                </FormField>
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>Bank Details</Typography>
              <Grid container spacing={2}>
                <FormField label="Account Number" required>
                  <TextField fullWidth size="small" name="accountNumber" value={formData.accountNumber} onChange={handleChange} error={!!errors.accountNumber} helperText={errors.accountNumber} />
                </FormField>
                <FormField label="IFSC Code" required>
                  <TextField fullWidth size="small" name="ifsc" value={formData.ifsc} onChange={handleChange} error={!!errors.ifsc} helperText={errors.ifsc} inputProps={{ maxLength: 11 }} />
                </FormField>
                <FormField label="Bank Name">
                  <TextField fullWidth size="small" name="bankName" value={formData.bankName} onChange={handleChange} />
                </FormField>
              </Grid>
            </Paper>
          )}

          {/* Navigation buttons (Previous/Next) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button variant="outlined" onClick={() => setActiveTab(activeTab - 1)} disabled={activeTab === 0}>
              Previous
            </Button>
            {activeTab < tabs.length - 1 ? (
              <Button variant="contained" onClick={() => handleTabChange(null, activeTab + 1)}>
                Next
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : (employee?.id ? 'Update Employee' : 'Register Employee')}
              </Button>
            )}
          </Box>
        </form>

        <Snackbar open={showSnackbar} autoHideDuration={4000} onClose={() => setShowSnackbar(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snackbarSeverity} onClose={() => setShowSnackbar(false)} variant="filled" sx={{ borderRadius: 2 }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AddEmployee;
