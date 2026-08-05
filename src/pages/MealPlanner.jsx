// src/pages/MealPlanner.jsx
import { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress, Chip, Button, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, Salad, ChefHat } from 'lucide-react';
import { fadeUp } from '../motion/variants';
import { useAuth } from '../hooks/useAuth';
import { getUserConditions } from '../logic/firestoreUser';
import { getActiveGoals } from '../logic/firestoreGoals';
import { selectMealPlanTemplate } from '../logic/mealPlanSelector';
import { generateCoachNotes, mergeCoachNotes } from '../logic/mealPlanCoach';
import { saveMealPlan, getMealPlan } from '../logic/firestoreMealPlans';
import MealPlanCard from '../components/MealPlanCard';

const MotionButton = motion.create(Button);

function PlannerEmptyState({ onGenerate, generating }) {
  return (
    <Box
      component={motion.div}
      key="empty"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      sx={{
        position: 'relative',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 3,
        overflow: 'hidden',
      }}
    >
      {/* soft floating gradient blobs */}
      <motion.div
        animate={{ y: [0, -14, 0], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '8%', left: '18%', width: 180, height: 180,
          borderRadius: '50%', background: 'radial-gradient(circle, #FFD95E55, transparent 70%)',
        }}
      />
      <motion.div
        animate={{ y: [0, 16, 0], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute', bottom: '12%', right: '15%', width: 220, height: 220,
          borderRadius: '50%', background: 'radial-gradient(circle, #63723944, transparent 70%)',
        }}
      />

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFD95E, #637239)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, position: 'relative', zIndex: 1,
        }}
      >
        <Salad size={40} color="#F0EADC" />
        <motion.div
          animate={{ rotate: [0, 12, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: -8, right: -8 }}
        >
          <Sparkles size={22} color="#8D844D" fill="#FFD95E" />
        </motion.div>
      </motion.div>

      <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', sm: '1.9rem' }, position: 'relative', zIndex: 1 }}>
        Let AI build your week
      </Typography>
      <Typography
        variant="body1"
        sx={{ color: 'text.secondary', maxWidth: 420, mt: 1.5, mb: 4, position: 'relative', zIndex: 1 }}
      >
        NutriSense will put together a full week of meals matched to your health conditions,
        nutrition goals, and preferences — with an AI coach explaining the reasoning behind it.
      </Typography>

      <MotionButton
        variant="contained"
        onClick={onGenerate}
        disabled={generating}
        startIcon={generating ? <CircularProgress size={16} sx={{ color: '#F0EADC' }} /> : <ChefHat size={18} />}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        sx={{
          bgcolor: 'primary.main',
          color: '#F0EADC',
          borderRadius: '999px',
          px: 4,
          py: 1.4,
          fontSize: '1rem',
          position: 'relative',
          zIndex: 1,
          transition: 'background-color 200ms ease',
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        {generating ? 'Building your plan…' : 'Create Meal Plan'}
      </MotionButton>
    </Box>
  );
}

// AiInsightCard — rectangle instead of pill, and add background.default
// awareness isn't needed here since it already sits on an ecru page, just
// matching the rectangular shape language of the day cards:
function AiInsightCard({ plan }) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      sx={{
        bgcolor: 'accent.main',
        color: 'accent.contrastText',
        borderRadius: '16px', // was 4 (pill-like) — now matches the day cards
        border: '2px solid',
        borderColor: 'rgba(78, 41, 37, 0.96)',
        p: { xs: 2.5, sm: 3.5 },
        mb: 3,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
        <Sparkles size={20} />
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.6, fontSize: '0.78rem' }}>
          YOUR AI COACH
        </Typography>
        {plan.matchedCondition && (
          <Chip
            size="small"
            label={`Matched to ${plan.matchedCondition}`}
            sx={{ ml: 'auto', bgcolor: 'rgba(63,71,40,0.12)', color: 'accent.contrastText', fontSize: '0.72rem' }}
          />
        )}
      </Stack>
      <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
        {plan.weeklyIntro || "This week's plan balances your goals with what's easiest to stick to — check each day for the reasoning behind it."}
      </Typography>
      {!plan.aiGenerated && (
        <Typography variant="body2" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
          AI personalization is temporarily unavailable — showing your condition-matched plan with standard tips.
        </Typography>
      )}
    </Box>
  );
}

export default function MealPlanner() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [coachStatus, setCoachStatus] = useState(null);
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
      const [conditions, activeGoals] = await Promise.all([
        getUserConditions(user.uid),
        getActiveGoals(user.uid),
      ]);
      const { template, matchedCondition, fallback } = selectMealPlanTemplate(conditions);

      setCoachStatus('thinking');
      const activeGoal = activeGoals?.[0] || null;
      const goalText = activeGoal?.sourceText || activeGoal?.rationale || '';

      let merged;
      try {
        const coachNotes = await generateCoachNotes({ condition: matchedCondition, goalText, template });
        merged = mergeCoachNotes(template, coachNotes);
        setCoachStatus('done');
      } catch (aiErr) {
        console.warn('AI coach unavailable, falling back to static tips:', aiErr);
        merged = mergeCoachNotes(template, null);
        setCoachStatus('unavailable');
      }

      // generatedAt is the single source of truth MealPlanCard uses to derive
      // both the weekday label and the date for every day in the plan.
      const planToSave = {
        ...merged,
        matchedCondition,
        usedFallbackTemplate: fallback,
        completed: {},
        generatedAt: Date.now(),
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

  const handleToggleDone = async (dayKey) => {
    if (!plan || !user) return;
    const previousPlan = plan;
    const updatedPlan = {
      ...plan,
      completed: { ...(plan.completed || {}), [dayKey]: !plan.completed?.[dayKey] },
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
    <Container maxWidth="xl" sx={{ py: 6, px: { xs: 2, sm: 3, md: 4 } }}>
      <AnimatePresence mode="wait">
        {!plan ? (
          <PlannerEmptyState key="empty" onGenerate={handleGenerate} generating={generating} />
        ) : (
          <motion.div
            key={plan.generatedAt || 'plan'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.25 } }}
          >
            <Box component={motion.div} variants={fadeUp} initial="hidden" animate="visible" sx={{ mb: 1 }}>
              <Typography variant="h2" sx={{ fontSize: '1.75rem', mb: 2 }}>
                This Week's Plan
              </Typography>
            </Box>

            <AiInsightCard plan={plan} />

            {generating && coachStatus === 'thinking' && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, color: 'text.secondary' }}>
                <Sparkles size={16} />
                <Typography variant="body1">AI coach is personalizing your plan…</Typography>
              </Stack>
            )}
            {error && (
              <Typography color="secondary.main" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <MealPlanCard plan={plan} onToggleDone={handleToggleDone} />

            <MotionButton
              fullWidth
              variant="contained"
              onClick={handleGenerate}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={16} sx={{ color: '#F0EADC' }} /> : <RefreshCw size={18} />}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              sx={{
                mt: 3,
                bgcolor: 'primary.dark',
                color: '#F0EADC',
                borderRadius: '999px',
                py: 1.4,
                fontSize: '1rem',
                transition: 'background-color 200ms ease',
                '&:hover': { bgcolor: 'secondary.main' },
              }}
            >
              {generating ? 'Regenerating…' : 'Generate New Plan'}
            </MotionButton>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}