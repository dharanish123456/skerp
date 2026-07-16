import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/auth/PrivateRoute';
import './App.css';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        } />
      </Routes>
    </ThemeProvider>
  );
}

export default App;