// src/pages/Dashboard.jsx
//
// Logged-in landing page. AppDrawer is mounted once by AppLayout.jsx and
// shared across all protected routes (Dashboard, Goals, Profile, etc.) —
// this page does NOT render its own AppDrawer instance. Per the
// established routing rule, AppNavbar and Footer are suppressed on the
// Dashboard route specifically (see AppLayout.jsx), and this page instead
// owns its own top bar (search / notifications / avatar) in their place.
//
// IMPORTANT — AppLayout.jsx update needed:
//   AppLayout should render <AppDrawer /> + <Outlet /> for every protected
//   route, but conditionally skip <AppNavbar />/<Footer /> when
//   location.pathname === '/dashboard' (this rule already existed for
//   Footer; extend the same check to AppNavbar). Example:
//
//   const { pathname } = useLocation();
//   const isDashboard = pathname === '/dashboard';
//   return (
//     <Box sx={{ display: 'flex' }}>
//       <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
//       <Box sx={{ flexGrow: 1 }}>
//         {!isDashboard && <AppNavbar onMenuClick={() => setDrawerOpen(true)} />}
//         <Outlet context={{ drawerOpen, setDrawerOpen }} />
//         {!isDashboard && <Footer />}
//       </Box>
//     </Box>
//   );
//
// Dashboard.jsx below reads the mobile-drawer toggle via useOutletContext()
// instead of owning its own AppDrawer/drawerOpen state.
//
// Data notes:
// - `todaysIntake`, `weekIntake`, `achievedGoals` are wired to placeholders
//   shaped to match what firestoreLogs/firestoreGoals will eventually
//   return — swap the mock loaders below for real calls once daily
//   nutrition logging aggregation exists.
// - `workouts` / `caloriesBurned` are mock data: NutriSense doesn't have a
//   workout-tracking backend yet, so this is a UI-complete placeholder
//   ready to wire to a future logic module (e.g. src/logic/workouts.js).
//
// Profile-completion prompt:
// - Uses getUserProfile(uid) from src/logic/firestoreUser.js (same source
//   of truth as Profile.jsx) to check whether the required fields
//   (fullName, heightCm, weightKg, age, gender) are all filled in.
// - Shows a dismissible "Complete your profile" banner at the top of the
//   page if the doc doesn't exist yet (brand-new signup) OR any required
//   field is missing/empty. Mirrors Profile.jsx's validate() exactly.
//
// Post-login/signup welcome toast:
// - Login.jsx / Signup.jsx must navigate here with
//     navigate('/dashboard', { state: { justAuthed: true } })
//   on successful auth. Dashboard reads location.state.justAuthed on
//   mount, shows a "Logged in successfully" toast (styled to match the
//   reference design: white card, green check, "View" button), then
//   immediately clears the router state via navigate(..., { replace: true,
//   state: {} }) so refreshing /dashboard or navigating back to it later
//   never re-triggers the toast. Auto-dismisses after 2.5s.
//
// Heading:
// - "Good Morning, {firstName}" shows ONLY the first name, even if
//   displayName is a full name like "Arpita Nath".

import { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  InputBase,
  IconButton,
  Avatar,
  Chip,
  Grid,
  Snackbar,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Search,
  Bell,
  Menu as MenuIcon,
  Plus,
  Dumbbell,
  Bike,
  PersonStanding,
  CheckCircle2,
  TriangleAlert,
} from 'lucide-react';

import {
  TodaysIntakeCard,
  WeekIntakeSummaryCard,
  AchievedGoalsCard,
  CaloriesBurnedCard,
} from '../components/dashboard/AnalyticsCards';
import WorkoutCard from '../components/dashboard/WorkoutCard';
import WorkoutDetails from '../components/dashboard/WorkoutDetails';
import MiniCalendar from '../components/dashboard/MiniCalendar';
import QuoteOfTheDay from '../components/dashboard/QuoteOfTheDay';
import { useAuth } from '../hooks/useAuth';
import { fadeUp, staggerContainer } from '../motion/variants';
import { getUserProfile } from '../logic/firestoreUser';

/* -------------------- Mock data (swap for real Firestore data) -------------------- */

const mockTodaysIntake = {
  calories: { consumed: 1450, target: 2100 },
  carbs: { consumed: 160, target: 240 },
  protein: { consumed: 78, target: 120 },
  fat: { consumed: 42, target: 65 },
};

const mockWeekIntake = [
  { day: 'Mon', calories: 1980 },
  { day: 'Tue', calories: 2100 },
  { day: 'Wed', calories: 1750 },
  { day: 'Thu', calories: 2250 },
  { day: 'Fri', calories: 1900 },
  { day: 'Sat', calories: 2400 },
  { day: 'Sun', calories: 1450 },
];

const mockAchievedGoals = { completed: 6, total: 8, streakDays: 4, todayPct: 75 };

const mockCaloriesBurned = { burned: 340, target: 500, activeMinutes: 42, workoutDurationMin: 35 };

const mockWorkouts = [
  {
    id: 'w1',
    name: 'Morning Strength Circuit',
    category: 'Strength',
    icon: Dumbbell,
    time: '07:00 AM',
    durationMin: 35,
    calories: 260,
    status: 'completed',
    muscleGroups: 'Full body — legs, core, shoulders',
    equipment: 'Dumbbells, resistance band',
    difficulty: 'Intermediate',
    trainerNote: 'Great pace today — keep rest under 45s between sets next time.',
  },
  {
    id: 'w2',
    name: 'Midday Cycle',
    category: 'Cardio',
    icon: Bike,
    time: '12:30 PM',
    durationMin: 25,
    calories: 210,
    status: 'today',
    muscleGroups: 'Quads, calves, cardiovascular system',
    equipment: 'Stationary bike',
    difficulty: 'Beginner',
    trainerNote: 'Keep cadence steady around 80–90 RPM.',
  },
  {
    id: 'w3',
    name: 'Evening Mobility Flow',
    category: 'Recovery',
    icon: PersonStanding,
    time: '06:30 PM',
    durationMin: 20,
    calories: 80,
    status: 'upcoming',
    muscleGroups: 'Hips, spine, shoulders',
    equipment: 'Mat',
    difficulty: 'Beginner',
    trainerNote: 'Focus on breath — this is a recovery session, not a burn session.',
  },
];

// Required fields for a "complete" profile — matches Profile.jsx's validate()
const REQUIRED_PROFILE_FIELDS = ['fullName', 'heightCm', 'weightKg', 'age', 'gender'];

/* -------------------- Top bar (Dashboard-owned, replaces AppNavbar here) -------------------- */

function DashboardTopBar({ onMenuClick }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1,
      }}
    >
      {!isDesktop && (
        <IconButton onClick={onMenuClick} sx={{ color: 'text.primary' }}>
          <MenuIcon size={22} />
        </IconButton>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'background.paper',
          borderRadius: '999px',
          px: 2,
          py: 0.75,
          flexGrow: 1,
          maxWidth: 420,
        }}
      >
        <Search size={17} color="#6B6550" />
        <InputBase
          placeholder="Search recipes, goals, history…"
          sx={{ fontSize: 13.5, flexGrow: 1, color: 'text.primary' }}
        />
      </Box>

      <Chip
        label="This Week"
        size="small"
        sx={{ bgcolor: 'background.paper', color: 'text.primary', fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
      />

      <Box sx={{ flexGrow: 1 }} />

      <IconButton sx={{ bgcolor: 'background.paper' }}>
        <Bell size={18} color="#3F4728" />
      </IconButton>
      <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
        {/* first initial from auth user, fallback N */}
      </Avatar>
    </Box>
  );
}

/* -------------------- Main Dashboard -------------------- */

export default function Dashboard() {
  const { user } = useAuth();
  const { setDrawerOpen } = useOutletContext() ?? { setDrawerOpen: () => {} };
  const [selectedWorkout, setSelectedWorkout] = useState(mockWorkouts[1]);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Show the "Logged in successfully" toast ONLY when arriving straight
  // from Login/Signup (via router state), and only for ~2.5s. Login.jsx /
  // Signup.jsx must call:
  //   navigate('/dashboard', { state: { justAuthed: true } })
  // on successful auth for this to trigger.
  useEffect(() => {
    if (location.state?.justAuthed) {
      setShowWelcomeToast(true);
      // Clear the router state so a refresh or later visit to /dashboard
      // doesn't re-trigger the toast.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Extract ONLY the first name for the heading (e.g. "Arpita Nath" -> "Arpita")
  const firstName = useMemo(() => {
    const rawName = user?.displayName || user?.email?.split('@')[0] || 'there';
    const first = rawName.trim().split(/\s+/)[0] || 'there';
    return first.charAt(0).toUpperCase() + first.slice(1);
  }, [user]);

  // Check profile completeness whenever the user changes (login/signup)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (cancelled) return;

        const isIncomplete =
          !profile ||
          REQUIRED_PROFILE_FIELDS.some(
            (field) => profile[field] === undefined || profile[field] === null || profile[field] === ''
          );

        setShowProfilePrompt(isIncomplete);
      } catch (err) {
        console.error('Failed to check profile completeness:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const remainingCalories = mockTodaysIntake.calories.target - mockTodaysIntake.calories.consumed;

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        px: { xs: 2, md: 3 },
        py: 2,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' },
        gap: 3,
        maxWidth: '100%',
        bgcolor: 'background.default',
        minHeight: '100vh',
      }}
    >
      {/* Welcome toast — shown only right after login/signup, styled to match reference */}
      <Snackbar
        open={showWelcomeToast}
        autoHideDuration={2500}
        onClose={() => setShowWelcomeToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 2 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            px: 2.5,
            py: 1.5,
            minWidth: { xs: 280, sm: 340 },
          }}
        >
          <CheckCircle2 size={20} color="#22C55E" style={{ flexShrink: 0 }} />
          <Typography sx={{ fontSize: 14.5, fontWeight: 500, color: '#111827', flexGrow: 1 }}>
            Logged in successfully
          </Typography>
          <Button
            onClick={() => setShowWelcomeToast(false)}
            sx={{
              bgcolor: 'primary.main',
              color: '#F0EADC',
              borderRadius: '10px',
              px: 2,
              py: 0.5,
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              flexShrink: 0,
              '&:hover': { bgcolor: 'secondary.main' },
            }}
          >
            View
          </Button>
        </Box>
      </Snackbar>

      {/* Profile completion prompt — styled to match the welcome toast card */}
      <Snackbar
        open={showProfilePrompt}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: showWelcomeToast ? 11 : 2 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            px: 2.5,
            py: 1.5,
            minWidth: { xs: 280, sm: 340 },
          }}
        >
          <TriangleAlert size={20} color="#E8A33D" style={{ flexShrink: 0 }} />
          <Typography sx={{ fontSize: 14.5, fontWeight: 500, color: '#111827', flexGrow: 1 }}>
            Complete your profile
          </Typography>
          <Button
            component="a"
            href="/profile"
            sx={{
              bgcolor: 'primary.main',
              color: '#F0EADC',
              borderRadius: '10px',
              px: 2,
              py: 0.5,
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 'auto',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: 'secondary.main' },
            }}
          >
            Complete now
          </Button>
        </Box>
      </Snackbar>

      {/* Center column */}
      <Box>
        <DashboardTopBar onMenuClick={() => setDrawerOpen(true)} />

        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <Typography
            sx={{
              fontFamily: '"Special Gothic Expanded One", sans-serif',
              fontSize: { xs: 22, md: 26 },
              color: 'text.primary',
              mt: 2,
            }}
          >
            Good Morning, {firstName}
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.5, mb: 3 }}>
            You've logged {mockTodaysIntake.calories.consumed} kcal today — {remainingCalories} kcal
            left toward your target, and you're {mockAchievedGoals.todayPct}% of the way through
            today's goals. Keep it up!
          </Typography>
        </motion.div>

        {/* Analytics cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer()}
        >
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <motion.div variants={fadeUp}>
                <TodaysIntakeCard data={mockTodaysIntake} />
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6}>
              <motion.div variants={fadeUp}>
                <WeekIntakeSummaryCard data={mockWeekIntake} />
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6}>
              <motion.div variants={fadeUp}>
                <AchievedGoalsCard data={mockAchievedGoals} />
              </motion.div>
            </Grid>
            <Grid item xs={12} sm={6}>
              <motion.div variants={fadeUp}>
                <CaloriesBurnedCard data={mockCaloriesBurned} />
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>

        {/* Workouts + Workout Details */}
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Box sx={{ borderRadius: '20px', bgcolor: 'background.paper', p: 2.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: 'text.primary' }}>
                  Workouts
                </Typography>
                <Chip
                  label="Today"
                  size="small"
                  sx={{ bgcolor: 'background.default', color: 'text.primary', fontWeight: 600 }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {mockWorkouts.map((w) => (
                  <WorkoutCard
                    key={w.id}
                    workout={w}
                    selected={selectedWorkout?.id === w.id}
                    onSelect={setSelectedWorkout}
                  />
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: 'text.primary', mb: 1.5 }}>
              Workout Details
            </Typography>
            <WorkoutDetails workout={selectedWorkout} />
          </Grid>
        </Grid>
      </Box>

      {/* Right sidebar */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          gap: 2.5,
          pt: 8,
        }}
      >
        <Box sx={{ borderRadius: '20px', bgcolor: 'background.paper', p: 2.25 }}>
          <MiniCalendar />
          <Box
            component="button"
            sx={{
              mt: 2,
              width: '100%',
              border: 'none',
              borderRadius: '14px',
              bgcolor: 'primary.main',
              color: '#F0EADC',
              py: 1,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              transition: 'background-color 160ms ease',
              '&:hover': { bgcolor: 'secondary.main' },
            }}
          >
            <Plus size={15} /> Add Event
          </Box>
        </Box>

        <QuoteOfTheDay />
      </Box>
    </Box>
  );
}
