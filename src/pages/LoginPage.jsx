import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  PersonOutlined,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import Hyperspeed from '../components/Hyperspeed/Hyperspeed';
import SpecularButton from '../components/SpecularButton/SpecularButton';
import ShineBorder from '../components/ShineBorder/ShineBorder';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [socialAlert, setSocialAlert] = useState(false);

  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter both username and password.');
      setOpenSnackbar(true);
      return;
    }

    setErrorMsg('');
    const result = await login(username, password);
    if (!result.success) {
      setErrorMsg(result.message);
      setOpenSnackbar(true);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSocialClick = (platform) => {
    setErrorMsg(`OAuth registration is disabled for local developer environments.`);
    setOpenSnackbar(true);
  };

  const hyperspeedOptions = useMemo(() => ({
    onSpeedUp: () => {},
    onSlowDown: () => {},
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 4,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [12, 80],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x0f172a,
      shoulderLines: 0xffffff,
      brokenLines: 0xffffff,
      leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
      rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
      sticks: 0x03b3c3
    }
  }), []);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        color: '#000000',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Left Panel: Welcome Card */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '50%',
          height: '100%',
          p: 3,
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 5,
            boxSizing: 'border-box',
          }}
        >
          {/* Hyperspeed Background Effect */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1,
            }}
          >
            <Hyperspeed effectOptions={hyperspeedOptions} />
          </Box>

          <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <Typography
              component="h1"
              sx={{
                color: '#ffffff',
                fontSize: { md: '2.5rem', lg: '3.25rem' },
                fontWeight: 800,
                lineHeight: 1.15,
                textShadow: '0 4px 16px rgba(0,0,0,0.45)',
              }}
            >
              Welcome to
              <br />
              SK-Enterprises
            </Typography>

            <Box
              component="a"
              href="https://skenterprises4u.com/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'inline-flex',
                mt: 2.5,
                px: 2.5,
                py: 1,
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '999px',
                backdropFilter: 'blur(8px)',
                fontSize: '0.875rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Visit Our Website
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right Panel: Welcome Back Form */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 4, sm: 8, md: 10 },
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '400px',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '20px',
            backgroundColor: '#ffffff',
            boxShadow: '0 18px 55px rgba(15, 23, 42, 0.10)',
            p: { xs: 3, sm: 4 },
            boxSizing: 'border-box',
          }}
        >
          <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />

          {/* Header */}
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              color: '#000000',
              textAlign: 'left',
              mb: 1,
              letterSpacing: '-0.5px',
            }}
          >
            Welcome back!
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
            Please enter your credentials to log in.
          </Typography>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: '#94a3b8',
                    '&.Mui-focused': { color: '#000000' },
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    borderRadius: '10px',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover': { backgroundColor: '#ffffff' },
                    '&:hover fieldset': { borderColor: '#e2e8f0' },
                    '&.Mui-focused fieldset': { borderColor: '#000000', borderWidth: '1.5px' },
                    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                      WebkitBoxShadow: '0 0 0 1000px #ffffff inset',
                      WebkitTextFillColor: '#000000',
                      caretColor: '#000000',
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#94a3b8' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: '#94a3b8',
                    '&.Mui-focused': { color: '#000000' },
                  },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    borderRadius: '10px',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover': { backgroundColor: '#ffffff' },
                    '&:hover fieldset': { borderColor: '#e2e8f0' },
                    '&.Mui-focused fieldset': { borderColor: '#000000', borderWidth: '1.5px' },
                    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
                      WebkitBoxShadow: '0 0 0 1000px #ffffff inset',
                      WebkitTextFillColor: '#000000',
                      caretColor: '#000000',
                    },
                  },
                }}
              />

              <Box sx={{ mt: 1 }}>
                <SpecularButton
                  type="submit"
                  disabled={isLoading}
                  size="md"
                  radius={10}
                  tint="#0f172a"
                  tintOpacity={1}
                  textColor="#ffffff"
                  lineColor="#ffff7f"
                  baseColor="#334155"
                  intensity={1.2}
                  shineSize={15}
                  shineFade={40}
                  thickness={1.5}
                  followMouse={true}
                  proximity={300}
                >
                  {isLoading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Log In'}
                </SpecularButton>
              </Box>
            </Box>
          </form>

          {/* Quick instructions / Help */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Developer Mode: Use <strong>admin / admin</strong> for Super Admin access
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Snackbar Alert for Errors */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="error"
          variant="filled"
          sx={{ width: '100%', backgroundColor: '#ef4444' }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginPage;
