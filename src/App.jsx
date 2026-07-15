import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Layout from './components/layout/Layout';
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
      <Layout />
    </ThemeProvider>
  );
}

export default App;