// src/router.jsx
// Route structure for NutriSense -- matches Page Navigation Map.
//
// TRIMMED to what exists today (Increment 1), with ComingSoon placeholders
// for nav links that don't have a built page yet. The full 11-route
// structure (Login, Signup, Dashboard, Health Goals, Profile, Meal Planner,
// Simulator, History, ProtectedRoute, AppLayout, useAuth) is Increment 2/4
// work -- those pages, the AppLayout shell, and the useAuth hook don't exist
// yet. Re-add each commented block below as its page/hook/layout gets built,
// swapping the matching ComingSoon route out at the same time.

import { createBrowserRouter } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

import PublicLayout from './layouts/PublicLayout';
import Home from './pages/Home';
import AnalyzeRecipe from './pages/AnalyzeRecipe';

// --- Increment 2: uncomment once these exist ---
// import AppLayout from './layouts/AppLayout';
// import Login from './pages/Login';
// import Signup from './pages/Signup';
// import Dashboard from './pages/Dashboard';
// import HealthGoals from './pages/HealthGoals';
// import Profile from './pages/Profile';
// import MealPlanner from './pages/MealPlanner';
// import Simulator from './pages/Simulator';
// import History from './pages/History';
// import NotFound from './pages/NotFound';
// import { useAuth } from './hooks/useAuth';
//
// function ProtectedRoute({ children }) {
//   const { user, loading } = useAuth();
//   const location = useLocation();
//   if (loading) return null; // LoadingSkeleton could go here instead
//   if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
//   return children;
// }

// Simple placeholder for nav links that don't have a built page yet
// (Meal Plans, Goals, About land in later increments per the roadmap).
// Swap each usage below for the real page as soon as it's built.
function ComingSoon({ label }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h3" sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif', color: 'text.primary' }}>
        {label} -- coming soon
      </Typography>
    </Box>
  );
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />, // AppNavbar only, no drawer
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <ComingSoon label="Login" /> },
      { path: '/signup', element: <ComingSoon label="Sign Up" /> },
      // Analyze Recipe is intentionally OUTSIDE ProtectedRoute -- usable logged out.
      // Stage 3's "Save to History" button checks auth state internally and
      // prompts login rather than gating the whole route.
      { path: '/analyze', element: <AnalyzeRecipe /> },
      { path: '/meal-plans', element: <ComingSoon label="Meal Plans" /> },
      { path: '/goals', element: <ComingSoon label="Goals" /> },
      { path: '/about', element: <ComingSoon label="About" /> },
    ],
  },
  // --- Increment 2: uncomment once AppLayout/ProtectedRoute/useAuth and the
  // pages below exist -- remove the matching ComingSoon route above at the
  // same time ---
  // {
  //   element: (
  //     <ProtectedRoute>
  //       <AppLayout /> {/* AppNavbar (solid) + AppDrawer */}
  //     </ProtectedRoute>
  //   ),
  //   children: [
  //     { path: '/dashboard', element: <Dashboard /> },
  //     { path: '/goals', element: <HealthGoals /> },
  //     { path: '/profile', element: <Profile /> },
  //     { path: '/meal-planner', element: <MealPlanner /> },
  //     { path: '/simulator', element: <Simulator /> },
  //     { path: '/simulator/:recipeId', element: <Simulator /> }, // pre-loaded from History/Dashboard
  //     { path: '/history', element: <History /> },
  //     { path: '/history/:recipeId', element: <AnalyzeRecipe /> }, // reopens Stage 3 results view for a past recipe
  //   ],
  // },
  // { path: '*', element: <NotFound /> },
]);
