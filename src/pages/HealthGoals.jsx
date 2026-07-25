// src/pages/HealthGoals.jsx
// Wires together GoalForm (create), GoalCard (display/manage), and
// firestoreGoals.getAllGoals (fetch) into the real Health Goals page.
//
// NOTE: imports EmptyState from '../components/EmptyState' per the shared
// component list in the UI guide. If that file doesn't exist yet, either
// build it (icon + text + action button, per guide) or tell me and I'll
// inline a simple fallback here instead.

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { getAllGoals } from '../logic/firestoreGoals';
import { useAuth } from '../hooks/useAuth';
import GoalForm from '../components/GoalForm';
import GoalCard from '../components/GoalCard';
import EmptyState from '../components/EmptyState';
import { fadeUp, staggerContainer } from '../motion/variants';

const MotionButton = motion.button;

export default function HealthGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

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

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 0 }, py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h3"
          sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif', color: 'text.primary' }}
        >
          Health Goals
        </Typography>
        <MotionButton
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onClick={() => setFormOpen(true)}
          style={{
            background: '#576238',
            color: '#F0EADC',
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
    </Box>
  );
}