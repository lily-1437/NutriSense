// src/layouts/PublicLayout.jsx
// Shell for logged-out / marketing routes (Home, Login, Signup, Analyze Recipe
// when used anonymously) -- AppNavbar only, no side drawer.
//
// AppNavbar is now a floating fixed-position pill (position: fixed, taken out
// of document flow), so a spacer Box equal to its height + top offset is
// required here -- otherwise page content renders underneath it (this was
// the "content push" bug flagged earlier).
//
// AppLayout (AppNavbar + AppDrawer, wrapped in ProtectedRoute) is Increment 2
// work -- it depends on useAuth, which doesn't exist yet.
//
// AppNavbar (and its spacer) is hidden on /login and /signup -- those pages
// use a plain, fast, distraction-free auth screen per the UI guide.

import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import AppNavbar, { NAVBAR_HEIGHT, NAVBAR_TOP_OFFSET } from '../components/AppNavbar';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const hideNavbar = pathname === '/login' || pathname === '/signup' || pathname === '/';

  return (
    <>
      {!hideNavbar && (
        <>
          <AppNavbar />
          <Box sx={{ height: NAVBAR_HEIGHT + NAVBAR_TOP_OFFSET }} />
        </>
      )}
      <Outlet />
    </>
  );
}