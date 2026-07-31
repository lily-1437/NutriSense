// src/pages/MealPlanner.jsx
import { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress, Chip, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { RefreshCw, Sparkles } from 'lucide-react';
import { fadeUp, staggerContainer } from '../motion/variants';
import { useAuth } from '../hooks/useAuth';
import { getUserConditions } from '../logic/firestoreUser';
import { getActiveGoals } from '../logic/firestoreGoals';
import { selectMealPlanTemplate } from '../logic/mealPlanSelector';
import { generateCoachNotes, mergeCoachNotes } from '../logic/mealPlanCoach';
import { saveMealPlan, getMealPlan } from '../logic/firestoreMealPlans';
import MealPlanCard from '../components/MealPlanCard';
import EmptyState from '../components/EmptyState';

// No standalone PrimaryButton.jsx exists in this codebase (same situation as
// NutritionSummary was) — RecipeInput.jsx's own pattern is to wrap MUI's
// Button locally with motion() rather than import a shared component, so
// this mirrors that exactly for consistency.
const MotionButton = motion.create(Button);

export default function MealPlanner() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [coachStatus, setCoachStatus] = useState(null); // 'thinking' | 'done' | 'unavailable'
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const existing = await getMealPlan(user.uid);
      setPlan(existing);
      setLoading(false);
    })();
  }, [user]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setCoachStatus(null);

    try {
      // Step 1 — deterministic, safety-relevant selection. No AI involved.
      const [conditions, activeGoals] = await Promise.all([
        getUserConditions(user.uid),
        getActiveGoals(user.uid),
      ]);
      const { template, matchedCondition, fallback } = selectMealPlanTemplate(conditions);

      // Step 2 — visible AI layer, grounded in the user's CURRENT active
      // goal (not a stale/completed one).
      setCoachStatus('thinking');
      const activeGoal = activeGoals?.[0] || null;
      const goalText = activeGoal?.sourceText || activeGoal?.rationale || '';

      let merged;
      try {
        const coachNotes = await generateCoachNotes({
          condition: matchedCondition,
          goalText,
          template,
        });
        merged = mergeCoachNotes(template, coachNotes);
        setCoachStatus('done');
      } catch (aiErr) {
        console.warn('AI coach unavailable, falling back to static tips:', aiErr);
        merged = mergeCoachNotes(template, null);
        setCoachStatus('unavailable');
      }

      // Regenerating resets the per-day "done" checklist, since it's a
      // fresh week's plan (possibly a different template/condition match).
      const planToSave = {
        ...merged,
        matchedCondition,
        usedFallbackTemplate: fallback,
        completed: {},
      };

      await saveMealPlan(user.uid, planToSave);
      setPlan(planToSave);
    } catch (err) {
      console.error('Meal plan generation failed:', err);
      setError('Could not generate a meal plan right now. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Toggles one day's completion status and persists it. Optimistic update
  // with rollback on failure, so the UI never claims a save succeeded when
  // it didn't.
  const handleToggleDone = async (dayName) => {
    if (!plan || !user) return;
    const previousPlan = plan;
    const updatedPlan = {
      ...plan,
      completed: {
        ...(plan.completed || {}),
        [dayName]: !plan.completed?.[dayName],
      },
    };
    setPlan(updatedPlan);
    try {
      await saveMealPlan(user.uid, updatedPlan);
    } catch (err) {
      console.error('Could not save completion status:', err);
      setPlan(previousPlan);
      setError('Could not save your progress. Please try again.');
    }
  };

  if (loading) return null;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box
        component={motion.div}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
      >
        <Box>
          <Typography variant="h2" sx={{ fontSize: '1.75rem' }}>
            Meal Planner
          </Typography>
          {plan?.matchedCondition && (
            <Chip
              size="small"
              icon={<Sparkles size={14} />}
              label={`Personalized for ${plan.matchedCondition}`}
              sx={{ mt: 1, bgcolor: 'accent.main', color: 'accent.contrastText' }}
            />
          )}
        </Box>
        {plan && (
          <MotionButton
            variant="contained"
            onClick={handleGenerate}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={16} sx={{ color: '#F0EADC' }} /> : <RefreshCw size={18} />}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            sx={{
              bgcolor: 'primary.dark',
              color: '#F0EADC',
              borderRadius: '20px',
              px: 3,
              transition: 'background-color 200ms ease',
              '&:hover': { bgcolor: 'secondary.main' },
            }}
          >
            {generating ? 'Regenerating…' : 'Regenerate'}
          </MotionButton>
        )}
      </Box>

      {generating && coachStatus === 'thinking' && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}
        >
          <Sparkles size={16} />
          <Typography variant="body1">AI coach is personalizing your plan…</Typography>
        </Box>
      )}

      {error && (
        <Typography color="secondary.main" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {!plan ? (
        <EmptyState
          title="No meal plan yet"
          message="We'll match a plan to your health conditions, then have your AI coach personalize it."
          actionLabel={generating ? 'Generating…' : "Generate This Week's Plan"}
          onAction={handleGenerate}
          disabled={generating}
        />
      ) : (
        <Box component={motion.div} variants={staggerContainer()} initial="hidden" animate="visible">
          <MealPlanCard
            plan={plan}
            onRegenerate={handleGenerate}
            regenerating={generating}
            onToggleDone={handleToggleDone}
          />
        </Box>
      )}
    </Container>
  );
}
