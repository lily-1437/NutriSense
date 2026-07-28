// src/layouts/PublicLayout.jsx
// Shell for logged-out / marketing routes (Home, Login, Signup, Analyze Recipe
// when used anonymously).
//
// AppNavbar has been removed from this layout entirely. Navigation now lives
// in AppDrawer for logged-in users (AppLayout); logged-out visitors navigate
// via in-page links/buttons on Home itself (e.g. "Analyze a Recipe", "Log In",
// "Sign Up" CTAs), rather than a persistent top nav bar.

import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return <Outlet />;
}
