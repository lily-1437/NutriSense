// src/components/MealPlanCard.jsx
import { useState } from 'react';
import {
  Card, CardContent, Box, Typography, Stack, Divider, Chip, Grid,
  Dialog, DialogContent, IconButton, Button,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Sparkles, X, RefreshCw, CheckCircle2, Circle } from 'lucide-react';
import { fadeUp, staggerContainer } from '../motion/variants';

const MotionCard = motion.create(Card);
const MotionButton = motion.create(Button);

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

function dayTeaser(day) {
  return day.meals?.dinner?.recipeName || day.meals?.lunch?.recipeName || 'View meals';
}

// plan.completed is a { [day]: boolean } map, e.g. { Monday: true, Tuesday: false }
export default function MealPlanCard({ plan, onRegenerate, regenerating, onToggleDone }) {
  const [selectedDay, setSelectedDay] = useState(null);

  const isDone = (dayName) => Boolean(plan.completed?.[dayName]);

  return (
    <Box>
      {plan.weeklyIntro && (
        <Card
          component={motion.div}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: 'accent.main', color: 'accent.contrastText' }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Sparkles size={18} />
            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              YOUR AI COACH
            </Typography>
          </Stack>
          <Typography variant="body1">{plan.weeklyIntro}</Typography>
        </Card>
      )}

      {!plan.aiGenerated && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          AI personalization is temporarily unavailable — showing your condition-matched plan with standard tips.
        </Typography>
      )}

      <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="visible">
        <Grid container spacing={2}>
          {plan.days.map((day) => {
            const done = isDone(day.day);
            return (
              <Grid item xs={6} sm={4} md={3} lg={12 / 7} key={day.day}>
                <motion.div variants={fadeUp}>
                  <MotionCard
                    onClick={() => setSelectedDay(day)}
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    sx={{
                      borderRadius: 3,
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      height: '100%',
                      position: 'relative',
                      opacity: done ? 0.65 : 1,
                    }}
                    elevation={0}
                  >
                    {done && (
                      <CheckCircle2
                        size={16}
                        color="#637239"
                        style={{ position: 'absolute', top: 8, right: 8 }}
                      />
                    )}
                    <CardContent>
                      <Typography variant="caption" sx={{ color: 'accent.dark', fontWeight: 700 }}>
                        {day.day.toUpperCase()}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          mt: 0.5,
                          fontSize: 14,
                          lineHeight: 1.3,
                          textDecoration: done ? 'line-through' : 'none',
                        }}
                      >
                        {dayTeaser(day)}
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </motion.div>

      <Dialog open={Boolean(selectedDay)} onClose={() => setSelectedDay(null)} maxWidth="sm" fullWidth>
        <AnimatePresence mode="wait">
          {selectedDay && (
            <Box
              component={motion.div}
              key={selectedDay.day}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DialogContent
                sx={{
                  p: 3,
                  // Hide scrollbar visually while keeping the content scrollable
                  scrollbarWidth: 'none', // Firefox
                  '&::-webkit-scrollbar': { display: 'none' }, // Chrome/Safari/Edge
                  msOverflowStyle: 'none', // old Edge/IE
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.3rem' }}>
                    {selectedDay.day}
                  </Typography>
                  <IconButton size="small" onClick={() => setSelectedDay(null)}>
                    <X size={18} />
                  </IconButton>
                </Box>

                <Stack spacing={2}>
                  {MEAL_ORDER.map((mealKey) => {
                    const meal = selectedDay.meals?.[mealKey];
                    if (!meal) return null;
                    return (
                      <Box key={mealKey}>
                        <Typography variant="caption" sx={{ color: 'accent.dark', fontWeight: 700 }}>
                          {MEAL_LABELS[mealKey].toUpperCase()}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {meal.recipeName}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {meal.rationale}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ~{meal.estCalories} kcal
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Dumbbell size={18} color="#ffcd28" style={{ marginTop: 2 }} />
                    <Typography variant="body1">{selectedDay.exerciseTip}</Typography>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                    sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 2 }}
                  >
                    <Sparkles size={16} color="#8D844D" style={{ marginTop: 2 }} />
                    <Box>
                      <Chip
                        label="Coach's Note"
                        size="small"
                        sx={{ mb: 0.5, height: 18, fontSize: '0.65rem', bgcolor: 'secondary.main', color: '#F0EADC' }}
                      />
                      <Typography variant="body1">{selectedDay.coachNote}</Typography>
                    </Box>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Mark as done / not done */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                  <MotionButton
                    variant={isDone(selectedDay.day) ? 'contained' : 'outlined'}
                    startIcon={isDone(selectedDay.day) ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    onClick={() => onToggleDone?.(selectedDay.day)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    sx={
                      isDone(selectedDay.day)
                        ? { bgcolor: 'primary.main', color: '#F0EADC', borderRadius: '20px', '&:hover': { bgcolor: 'primary.dark' } }
                        : { borderColor: 'primary.main', color: 'primary.main', borderRadius: '20px', '&:hover': { bgcolor: 'primary.main', color: '#F0EADC' } }
                    }
                  >
                    {isDone(selectedDay.day) ? 'Marked as Done' : 'Mark as Done'}
                  </MotionButton>

                  {onRegenerate && (
                    <MotionButton
                      variant="text"
                      disabled={regenerating}
                      onClick={onRegenerate}
                      startIcon={<RefreshCw size={16} />}
                      whileHover={{ scale: 1.03 }}
                      sx={{ color: 'secondary.main' }}
                    >
                      {regenerating ? 'Regenerating…' : 'Regenerate Plan'}
                    </MotionButton>
                  )}
                </Box>
              </DialogContent>
            </Box>
          )}
        </AnimatePresence>
      </Dialog>
    </Box>
  );
}