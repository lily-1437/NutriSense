// src/layouts/AppLayout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
//import AppDrawer from '../components/AppDrawer';
import Footer from '../components/Footer';
import { Box } from '@mui/material';

export default function AppLayout() {
  const { pathname } = useLocation();
  const isDashboard = pathname === '/dashboard';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppNavbar solid />
      <Box sx={{ display: 'flex', flex: 1 }}>
{/* <AppDrawer /> */}
        <Box component="main" sx={{ flex: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
      {!isDashboard && <Footer />}
    </Box>
  );
}