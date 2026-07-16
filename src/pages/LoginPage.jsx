import React, { useState, useEffect } from 'react';
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
  FormatQuote,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

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
      {/* Left Panel: Testimonial & Image Card */}
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
            backgroundImage: 'url("/login_person.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 5,
            boxSizing: 'border-box',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
              zIndex: 1,
            },
          }}
        >
          {/* Quote Icon */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              alignSelf: 'flex-start',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <FormatQuote sx={{ color: '#000000', fontSize: 28 }} />
          </Box>

          {/* Testimonial Quote */}
          <Box sx={{ position: 'relative', zIndex: 2, color: '#ffffff' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                borderRadius: '20px',
                px: 2,
                py: 0.5,
                mb: 2,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                skerp.com
              </Typography>
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 500,
                lineHeight: 1.4,
                mb: 3,
                fontSize: '1.45rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              "The SKERP platform's flexibility is truly remarkable. It seamlessly manages all employee records, expense tracking, and advance payments in one unified workspace."
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Dharanish Kumar
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Operations Director - SK Enterprises
            </Typography>
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
        <Box sx={{ width: '100%', maxWidth: '400px' }}>
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
                    '&:hover fieldset': { borderColor: '#94a3b8' },
                    '&.Mui-focused fieldset': { borderColor: '#000000', borderWidth: '1.5px' },
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
                    '&:hover fieldset': { borderColor: '#94a3b8' },
                    '&.Mui-focused fieldset': { borderColor: '#000000', borderWidth: '1.5px' },
                  },
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1.8,
                  mt: 1,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  borderRadius: '10px',
                  boxShadow: 'none',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: '#1e293b',
                    boxShadow: 'none',
                  },
                }}
              >
                {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Log In'}
              </Button>
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
