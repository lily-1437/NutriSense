// src/pages/HealthGoals.jsx
// Wires together GoalForm (create), GoalCard (display/manage), and
// firestoreGoals.getAllGoals (fetch) into the real Health Goals page.
// Also hosts ConditionSelector (Increment 3) -- same instance reused on
// Profile.jsx, per the UI guide's "same component, two entry points" rule.
// Conditions load/save independently of goals via firestoreUser.js.

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid, CircularProgress, Snackbar, Alert, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { getAllGoals } from '../logic/firestoreGoals';
import { getUserConditions, updateUserConditions } from '../logic/firestoreUser';
import { useAuth } from '../hooks/useAuth';
import GoalForm from '../components/GoalForm';
import GoalCard from '../components/GoalCard';
import EmptyState from '../components/EmptyState';
import ConditionSelector from '../components/ConditionSelector';
import { fadeUp, staggerContainer } from '../motion/variants';

const MotionButton = motion.button;

export default function HealthGoals() {
  const { user } = useAuth();
  const theme = useTheme();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // ---- Conditions (Increment 3) ----
  const [conditions, setConditions] = useState([]);
  const [conditionsLoading, setConditionsLoading] = useState(true);
  const [savingConditions, setSavingConditions] = useState(false);
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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setConditionsLoading(true);
    getUserConditions(user.uid)
      .then((data) => {
        if (!cancelled) setConditions(data);
      })
      .catch(() => {
        if (!cancelled) {
          setSnackbar({ open: true, message: 'Could not load your conditions.', severity: 'error' });
        }
      })
      .finally(() => {
        if (!cancelled) setConditionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Auto-saves on every change (add/remove) rather than requiring a
  // separate "Save conditions" button -- matches how GoalForm's describe
  // -> review -> save flow already keeps interactions low-friction.
  const handleConditionsChange = async (newConditions) => {
    setConditions(newConditions); // optimistic update
    if (!user) return;
    setSavingConditions(true);
    try {
      await updateUserConditions(user.uid, newConditions);
    } catch (err) {
      setSnackbar({ open: true, message: 'Could not save conditions. Please try again.', severity: 'error' });
    } finally {
      setSavingConditions(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 0 }, py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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

      {/* Conditions section (Increment 3) */}
      <Box sx={{ mb: 4, p: 2.5, borderRadius: '20px', bgcolor: 'background.paper' }}>
        <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
          Health Conditions
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 2 }}>
          These power ingredient risk flags and substitution suggestions in Analyze Recipe.
        </Typography>
        {conditionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={22} sx={{ color: 'primary.main' }} />
          </Box>
        ) : (
          <ConditionSelector
            value={conditions}
            onChange={handleConditionsChange}
            disabled={savingConditions}
          />
        )}
      </Box>

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

      {!loading && goals.length > 0 && (
        <motion.div variants={staggerContainer()} initial="hidden" animate="visible">
          <Grid container spacing={2}>
            {goals.map((goal) => (
              <Grid item xs={12} sm={6} md={4} key={goal.id}>
                <motion.div variants={fadeUp}>
                  <GoalCard goal={goal} onChanged={loadGoals} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}

      <GoalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={loadGoals}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
