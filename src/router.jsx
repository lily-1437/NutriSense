import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AnalyzeRecipe from './pages/AnalyzeRecipe';
import Dashboard from './pages/Dashboard';
import HealthGoals from './pages/HealthGoals';
import Profile from './pages/Profile';
import MealPlanner from './pages/MealPlanner';
import Simulator from './pages/Simulator';
import BMI from './pages/BMI';
import History from './pages/History';
import RecipeDetails from './pages/RecipeDetails';
import NotFound from './pages/NotFound';

import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; 
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />, 
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/analyze', element: <AnalyzeRecipe /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout /> {/* AppNavbar (solid) + AppDrawer */}
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/goals', element: <HealthGoals /> },
      { path: '/profile', element: <Profile /> },
      { path: '/meal-planner', element: <MealPlanner /> },
      { path: '/simulator', element: <Simulator /> },
      { path: '/simulator/:recipeId', element: <Simulator /> }, 
      { path: '/bmi', element: <BMI /> },
      { path: '/history', element: <History /> },
      { path: '/history/:recipeId', element: <RecipeDetails /> }, 
    ],
  },
  { path: '*', element: <NotFound /> },
]);
