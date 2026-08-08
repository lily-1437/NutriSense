// src/layouts/AppLayout.jsx
//
// Shell for all logged-in/protected routes (Dashboard, Goals, Profile,
// Meal Planner, Simulator, History). AppDrawer is now restricted to the
// Dashboard route only -- every other protected route renders without a
// side drawer (plain content column, no footer), since only Dashboard's
// design currently depends on the drawer + no-navbar layout.
//
// AppNavbar is intentionally NOT rendered here at all -- it's exclusive to
// PublicLayout (the logged-out/marketing shell) and has been removed there
// too per the latest change.
//
// Footer is NOT rendered on any protected route (removed here entirely) --
// the marketing footer now lives inside ApproachSection.jsx on the public
// homepage only, and protected app pages don't need a footer.

import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppDrawer from '../components/AppDrawer';
import FooterBar from '../components/FooterBar';
import { Box } from '@mui/material';

export default function AppLayout() {
  const { pathname } = useLocation();
  const isDashboard = pathname === '/dashboard';
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isDashboard && (
        <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, bgcolor: 'background.default' }}>
        <Box component="main" sx={{ flex: 1, p: isDashboard ? 0 : 3 }}>
          <Outlet context={{ drawerOpen, setDrawerOpen }} />
        </Box>
        {!isDashboard && <FooterBar />}
      </Box>
    </Box>
  );
}
