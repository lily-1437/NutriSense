// src/router.jsx
// Route structure for NutriSense — matches Page Navigation Map.
// Two shells: PublicLayout (AppNavbar only) and AppLayout (AppNavbar + AppDrawer).
// ProtectedRoute redirects to /login if not authenticated, preserving intended destination.

import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AnalyzeRecipe from './pages/AnalyzeRecipe';

// --- Pages not yet built — swap in as each lands ---
import Dashboard from './pages/Dashboard';
import HealthGoals from './pages/HealthGoals';
// import Profile from './pages/Profile';
// import MealPlanner from './pages/MealPlanner';
// import Simulator from './pages/Simulator';
// import History from './pages/History';
import NotFound from './pages/NotFound';

import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // LoadingSkeleton could go here instead
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />, // AppNavbar only, no drawer
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      // Analyze Recipe is intentionally OUTSIDE ProtectedRoute — usable logged out.
      // Stage 3's "Save to History" button checks auth state internally and
      // prompts login rather than gating the whole route.
      { path: '/analyze', element: <AnalyzeRecipe /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout /> {/* AppNavbar + AppDrawer */}
      </ProtectedRoute>
    ),
    children: [
      // --- Uncomment each line as its page gets built ---
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/goals', element: <HealthGoals /> },
      // { path: '/profile', element: <Profile /> },
      // { path: '/meal-planner', element: <MealPlanner /> },
      // { path: '/simulator', element: <Simulator /> },
      // { path: '/simulator/:recipeId', element: <Simulator /> }, // pre-loaded from History/Dashboard
      // { path: '/history', element: <History /> },
      // { path: '/history/:recipeId', element: <AnalyzeRecipe /> }, // reopens Stage 3 results view for a past recipe
    ],
  },
   { path: '*', element: <NotFound /> }, // uncomment once NotFound.jsx exists
]);