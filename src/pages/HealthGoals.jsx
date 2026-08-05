// src/pages/HealthGoals.jsx
// Wires together GoalForm (create/AI-recommend), GoalCard (display/manage/
// complete), GoalDetailDialog (read-only full detail on card click), and
// firestoreGoals.getAllGoals (fetch) into the Health Goals page redesign:
// State 1/2 live inside GoalForm's dialog; State 3 (Active Goals dashboard)
// lives here, with a segmented All/Active/Completed filter and
// AnimatePresence-driven complete/undo animations.
//
// ConditionSelector now lives on Profile.jsx only -- it was previously
// duplicated here, removed per redesign to avoid two sources of truth for
// the same Firestore-backed conditions list.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, Snackbar, Alert, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { getAllGoals } from '../logic/firestoreGoals';
import { useAuth } from '../hooks/useAuth';
import GoalForm from '../components/GoalForm';
import GoalCard from '../components/GoalCard';
import EmptyState from '../components/EmptyState';
import GoalDetailDialog from '../components/GoalDetailDialog';
import { fadeUp, staggerContainer, goalCompleteExit, goalUndoEnter } from '../motion/variants';

const MotionButton = motion.button;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export default function HealthGoals() {
  const { user } = useAuth();
  const theme = useTheme();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [detailGoal, setDetailGoal] = useState(null);

  // ---- Toast (bottom-right, per redesign) ----
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getAllGoals(user.uid);
    setGoals(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Fired by GoalForm after createGoal() succeeds -- shows the toast and
  // refreshes the dashboard list (State 2 -> State 3 transition).
  const handleSetGoal = () => {
    setSnackbar({ open: true, message: 'Target has been set.', severity: 'success' });
    loadGoals();
  };

  const visibleGoals = useMemo(() => {
    if (filter === 'active') return goals.filter((g) => g.status !== 'completed');
    if (filter === 'completed') return goals.filter((g) => g.status === 'completed');
    return goals;
  }, [goals, filter]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h3" sx={{ color: 'text.primary' }}>
          Health Goals
        </Typography>
        <MotionButton
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onClick={() => setFormOpen(true)}
          style={{
            background: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            border: 'none',
            borderRadius: '25px',
            padding: '10px 20px',
            fontFamily: 'inherit',
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          + New Goal
        </MotionButton>
      </Box>


      {/* Segmented All / Active / Completed filter */}
      {!loading && goals.length > 0 && (
        <Box
          sx={{
            display: 'inline-flex', gap: 0.5, p: 0.5, mb: 3,
            borderRadius: '999px', bgcolor: 'background.paper',
          }}
        >
          {FILTERS.map((f) => (
            <Box
              key={f.key}
              component="button"
              onClick={() => setFilter(f.key)}
              sx={{
                border: 'none', cursor: 'pointer', px: 2.25, py: 0.75,
                borderRadius: '999px', fontFamily: 'inherit', fontSize: 13.5,
                fontWeight: 600, transition: 'background-color 150ms ease, color 150ms ease',
                bgcolor: filter === f.key ? 'primary.main' : 'transparent',
                color: filter === f.key ? '#F0EADC' : 'text.secondary',
              }}
            >
              {f.label}
            </Box>
          ))}
        </Box>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
      )}

      {!loading && goals.length === 0 && (
        <EmptyState
          title="No health goals yet"
          message="Describe a goal in your own words and we'll set the targets for you."
          actionLabel="Create Goal"
          onAction={() => setFormOpen(true)}
        />
      )}

      {!loading && goals.length > 0 && visibleGoals.length === 0 && (
        <EmptyState
          title={`No ${filter} goals`}
          message="Switch filters or create a new goal to get started."
          actionLabel="Create Goal"
          onAction={() => setFormOpen(true)}
        />
      )}

      {!loading && visibleGoals.length > 0 && (
        <motion.div variants={staggerContainer()} initial="hidden" animate="visible">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <AnimatePresence initial={false}>
              {visibleGoals.map((goal) => (
                <motion.div
                  key={goal.id}
                  layout
                  variants={goal.status === 'completed' ? goalUndoEnter : fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit={goalCompleteExit}
                >
                  <GoalCard goal={goal} onChanged={loadGoals} onOpenDetail={setDetailGoal} />
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>
        </motion.div>
      )}

      <GoalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSetGoal={handleSetGoal}
      />

      <GoalDetailDialog
        goal={detailGoal}
        open={!!detailGoal}
        onClose={() => setDetailGoal(null)}
      />

      {/* Bottom-right toast, per redesign brief */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          icon={<CheckCircle2 size={20} color="#637239" />}
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{
            borderRadius: '16px',
            bgcolor: 'background.paper',
            color: 'text.primary',
            '& .MuiAlert-icon': { alignItems: 'center' },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
    </Box>
  );
}
