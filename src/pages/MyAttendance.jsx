import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Paper, Snackbar, Typography
} from '@mui/material';
import {
  Login as CheckInIcon, Logout as CheckOutIcon, TaskAlt as CompleteIcon,
  Block as BlockIcon, CameraAlt as CameraIcon, LocationOn as LocationIcon,
  Refresh as RetakeIcon, CheckCircle as ConfirmIcon, UploadFile as UploadIcon
} from '@mui/icons-material';
import { checkIn, checkOut, fetchTodayAttendance } from '../services/attendanceService';

const formatIST = (date, options) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', ...options,
}).format(date);

const formatTime = (value) => {
  if (!value) return '—';
  const [hour, minute] = value.split(':').map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const MyAttendance = () => {
  const [attendance, setAttendance] = useState(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  // Camera & Geolocation Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState('CHECK_IN'); // 'CHECK_IN' | 'CHECK_OUT'
  const [stream, setStream] = useState(null);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchTodayAttendance()
      .then(setAttendance)
      .catch((error) => setFeedback({ open: true, message: error.message, severity: 'error' }))
      .finally(() => setLoading(false));
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startCameraAndLocation = async () => {
    setCameraError('');
    setLocationError('');
    setSelfieBlob(null);
    setSelfiePreview(null);
    setLocation(null);

    // Get location
    if (navigator.geolocation) {
      setFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setFetchingLocation(false);
        },
        (err) => {
          setLocationError(err.message || 'Unable to retrieve location');
          setFetchingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }

    // Start video camera
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setCameraError('Camera access denied or unavailable. Please enable permissions or upload a photo.');
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, modalOpen]);

  const handleOpenModal = (type) => {
    setActionType(type);
    setModalOpen(true);
    startCameraAndLocation();
  };

  const handleCloseModal = () => {
    stopCamera();
    setModalOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setSelfiePreview(dataUrl);

    canvas.toBlob(
      (blob) => {
        setSelfieBlob(blob);
      },
      'image/jpeg',
      0.85
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieBlob(file);
      setSelfiePreview(URL.createObjectURL(file));
      setCameraError('');
    }
  };

  const retakePhoto = () => {
    setSelfieBlob(null);
    setSelfiePreview(null);
  };

  const confirmAttendance = async () => {
    setActing(true);
    handleCloseModal();
    const payload = {
      selfieBlob,
      latitude: location?.latitude,
      longitude: location?.longitude,
    };
    try {
      const updated = actionType === 'CHECK_OUT' ? await checkOut(payload) : await checkIn(payload);
      setAttendance(updated);
      setFeedback({ open: true, message: updated.message, severity: 'success' });
    } catch (error) {
      setFeedback({ open: true, message: error.message, severity: 'error' });
      try { setAttendance(await fetchTodayAttendance()); } catch { /* retain state */ }
    } finally {
      setActing(false);
    }
  };

  const markAttendance = () => {
    if (attendance?.state === 'CHECKED_IN') {
      handleOpenModal('CHECK_OUT');
    } else {
      handleOpenModal('CHECK_IN');
    }
  };

  const action = useMemo(() => {
    switch (attendance?.state) {
      case 'CHECKED_IN': return { label: 'Check Out', Icon: CheckOutIcon, color: '#ea580c', hover: '#c2410c', disabled: false };
      case 'COMPLETED': return { label: 'Completed', Icon: CompleteIcon, color: '#475569', hover: '#475569', disabled: true };
      case 'BLOCKED': return { label: 'Unavailable', Icon: BlockIcon, color: '#b91c1c', hover: '#b91c1c', disabled: true };
      default: return { label: 'Check In', Icon: CheckInIcon, color: '#16a34a', hover: '#15803d', disabled: false };
    }
  }, [attendance]);

  if (loading) return <Box sx={{ minHeight: 420, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;

  const ActionIcon = action.Icon;

  return (
    <Box sx={{ minHeight: 'calc(100vh - 180px)', display: 'grid', placeItems: 'center', px: 1 }}>
      <Paper elevation={0} sx={{ width: '100%', maxWidth: 520, border: '1px solid #e2e8f0', borderRadius: 4, p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
        <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '1rem' }}>{formatIST(now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
        <Typography sx={{ color: '#0f172a', fontWeight: 800, fontSize: { xs: '2rem', sm: '2.5rem' }, mt: 0.5 }}>{formatIST(now, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</Typography>

        <Button
          variant="contained"
          disabled={action.disabled || acting}
          onClick={markAttendance}
          aria-label={action.label}
          sx={{
            mt: 4, width: { xs: 210, sm: 250 }, height: { xs: 210, sm: 250 }, borderRadius: '50%',
            display: 'flex', flexDirection: 'column', gap: 1.5, fontSize: '1.5rem', fontWeight: 800,
            textTransform: 'none', backgroundColor: action.color, boxShadow: `0 18px 35px ${action.color}35`,
            '&:hover': { backgroundColor: action.hover },
            '&.Mui-disabled': { color: '#fff', backgroundColor: action.color, opacity: 0.85 },
          }}
        >
          {acting ? <CircularProgress color="inherit" size={52} /> : <><ActionIcon sx={{ fontSize: 58 }} />{action.label}</>}
        </Button>

        <Typography sx={{ mt: 3, color: attendance?.state === 'BLOCKED' ? '#b91c1c' : '#475569', fontWeight: 600 }}>{attendance?.message}</Typography>
        {attendance?.state === 'BLOCKED' && <Typography sx={{ mt: 0.5, color: '#64748b', fontSize: '0.875rem' }}>If you cannot check in or out, please contact HR.</Typography>}

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 4 }}>
          <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f0fdf4' }}><Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>CHECK IN</Typography><Typography sx={{ color: '#166534', fontWeight: 800, fontSize: '1.15rem' }}>{formatTime(attendance?.checkIn)}</Typography></Box>
          <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#fff7ed' }}><Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>CHECK OUT</Typography><Typography sx={{ color: '#9a3412', fontWeight: 800, fontSize: '1.15rem' }}>{formatTime(attendance?.checkOut)}</Typography></Box>
        </Box>
      </Paper>

      {/* Selfie & Location Verification Dialog */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {actionType === 'CHECK_OUT' ? 'Check Out Verification' : 'Check In Verification'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mt: 1 }}>
            {/* Camera View / Preview */}
            <Box sx={{ position: 'relative', width: '100%', height: 260, borderRadius: 3, overflow: 'hidden', backgroundColor: '#0f172a', display: 'grid', placeItems: 'center' }}>
              {selfiePreview ? (
                <img src={selfiePreview} alt="Selfie preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : cameraError ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography sx={{ color: '#f87171', fontSize: '0.875rem', fontWeight: 600, mb: 1 }}>
                    {cameraError}
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    You can upload a photo from your device below to complete verification.
                  </Typography>
                </Box>
              ) : (
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              )}
            </Box>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Camera / Upload Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
              {selfiePreview ? (
                <Button variant="outlined" startIcon={<RetakeIcon />} onClick={retakePhoto} sx={{ textTransform: 'none', borderRadius: 2 }}>
                  Change Photo
                </Button>
              ) : (
                <>
                  {!cameraError ? (
                    <Button variant="contained" color="primary" startIcon={<CameraIcon />} onClick={capturePhoto} sx={{ textTransform: 'none', borderRadius: 2 }}>
                      Snap Selfie
                    </Button>
                  ) : (
                    <Button variant="outlined" color="primary" startIcon={<RetakeIcon />} onClick={startCameraAndLocation} sx={{ textTransform: 'none', borderRadius: 2 }}>
                      Retry Camera
                    </Button>
                  )}
                  <Button variant={cameraError ? 'contained' : 'outlined'} component="label" startIcon={<UploadIcon />} sx={{ textTransform: 'none', borderRadius: 2 }}>
                    Upload Photo
                    <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
                  </Button>
                </>
              )}
            </Box>

            {/* Geolocation Status */}
            <Paper elevation={0} sx={{ width: '100%', p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocationIcon sx={{ color: location ? '#16a34a' : '#94a3b8' }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>LOCATION DATA</Typography>
                {fetchingLocation ? (
                  <Typography sx={{ fontSize: '0.8125rem', color: '#0f172a' }}>Acquiring GPS location...</Typography>
                ) : location ? (
                  <Typography sx={{ fontSize: '0.8125rem', color: '#166534', fontWeight: 600 }}>
                    Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
                  </Typography>
                ) : locationError ? (
                  <Typography sx={{ fontSize: '0.8125rem', color: '#b91c1c' }}>{locationError}</Typography>
                ) : (
                  <Typography sx={{ fontSize: '0.8125rem', color: '#64748b' }}>GPS location pending...</Typography>
                )}
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseModal} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            color={actionType === 'CHECK_OUT' ? 'warning' : 'success'}
            startIcon={<ConfirmIcon />}
            disabled={!selfieBlob || acting}
            onClick={confirmAttendance}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {actionType === 'CHECK_OUT' ? 'Confirm & Check Out' : 'Confirm & Check In'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={feedback.open} autoHideDuration={4000} onClose={() => setFeedback((v) => ({ ...v, open: false }))}><Alert severity={feedback.severity} onClose={() => setFeedback((v) => ({ ...v, open: false }))}>{feedback.message}</Alert></Snackbar>
    </Box>
  );
};

export default MyAttendance;
