// src/main.jsx
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@mui/material';
import { AuthProvider } from './hooks/useAuth';
import { router } from './router';
import './index.css'
import theme from './theme';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </MotionConfig>
  </ThemeProvider>
);
