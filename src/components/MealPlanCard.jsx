// src/components/MealPlanCard.jsx
import { useState } from 'react';
import { Box, Typography, Stack, Collapse, IconButton, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import {
  Coffee, UtensilsCrossed, Soup, Apple,
  CheckCircle2, Circle, ChevronDown, Flame,
} from 'lucide-react';
import { fadeUp, staggerContainer } from '../motion/variants';

const MotionBox = motion.create(Box);

const DAY_PALETTE = ['#F7DDD5', '#D8A4AF', '#AFB8CD', '#CCC3D1', '#8D8B4C', '#65613F', '#6B403B'];

function textColorFor(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? '#6B403B' : '#F7DDD5';
}

function toDate(generatedAt) {
  if (!generatedAt) return null;
  if (generatedAt instanceof Date) return generatedAt;
  if (typeof generatedAt === 'number') return new Date(generatedAt);
  if (typeof generatedAt.toDate === 'function') return generatedAt.toDate();
  if (typeof generatedAt.seconds === 'number') return new Date(generatedAt.seconds * 1000);
  return null;
}

function deriveDisplayDate(generatedAt, dayIndex) {
  const base = toDate(generatedAt);
  if (!base || Number.isNaN(base.getTime())) return { weekday: null, dateLabel: null };
  const date = new Date(base);
  date.setDate(date.getDate() + dayIndex);
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
    dateLabel: date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
  };
}

const MEAL_META = {
  breakfast: { label: 'Breakfast', icon: Coffee },
  lunch: { label: 'Lunch', icon: UtensilsCrossed },
  dinner: { label: 'Dinner', icon: Soup },
  snack: { label: 'Snack', icon: Apple },
};
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

function MealRow({ mealKey, meal, textColor, mutedColor }) {
  const [open, setOpen] = useState(false);
  const Meta = MEAL_META[mealKey];
  const hasDetail = Boolean(meal.estCalories || meal.estProtein);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        onClick={() => hasDetail && setOpen((v) => !v)}
        sx={{ cursor: hasDetail ? 'pointer' : 'default', py: 1 }}
      >
        <Meta.icon size={18} color={textColor} style={{ opacity: 0.85, flexShrink: 0 }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" sx={{ color: mutedColor, fontWeight: 700, letterSpacing: 0.4, fontSize: '0.72rem' }}>
            {Meta.label.toUpperCase()}
          </Typography>
          <Typography variant="body1" sx={{ color: textColor, fontWeight: 700, fontSize: 16, lineHeight: 1.35 }}>
            {meal.recipeName}
          </Typography>
        </Box>
        {hasDetail && (
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} color={mutedColor} />
          </motion.div>
        )}
      </Stack>
      <Collapse in={open} timeout={200}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pb: 1.25, pl: '30px' }}>
          {meal.estCalories && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Flame size={14} color={mutedColor} />
              <Typography variant="body2" sx={{ color: mutedColor }}>
                ~{meal.estCalories} kcal
              </Typography>
            </Stack>
          )}
          {meal.estProtein && (
            <Typography variant="body2" sx={{ color: mutedColor }}>
              {meal.estProtein}g protein
            </Typography>
          )}
          {meal.rationale && (
            <Typography variant="body2" sx={{ color: mutedColor, fontStyle: 'italic' }}>
              {meal.rationale}
            </Typography>
          )}
        </Stack>
      </Collapse>
    </Box>
  );
}

export default function MealPlanCard({ plan, onToggleDone }) {
  const isDone = (dayKey) => Boolean(plan.completed?.[dayKey]);

  return (
    <motion.div variants={staggerContainer(0.09)} initial="hidden" animate="visible">
      <Stack spacing={2.5}>
        {plan.days.map((day, i) => {
          const bg = DAY_PALETTE[i % DAY_PALETTE.length];
          const textColor = textColorFor(bg);
          const mutedColor = textColor === '#6B403B' ? 'rgba(107,64,59,0.68)' : 'rgba(247,221,213,0.8)';
          const dividerColor = textColor === '#6B403B' ? 'rgba(107,64,59,0.18)' : 'rgba(247,221,213,0.25)';
          const done = isDone(day.day);
          const { weekday, dateLabel } = deriveDisplayDate(plan.generatedAt, i);

          return (
            <MotionBox
              key={day.day}
              variants={fadeUp}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              sx={{
                bgcolor: bg,
                borderRadius: '16px',
                border: '2px solid',
                borderColor: 'rgba(78, 41, 37, 0.96)',
                p: { xs: 2.5, sm: 3.5 },
                position: 'relative',
                opacity: done ? 0.72 : 1,
              }}
            >
              <IconButton
                size="small"
                onClick={() => onToggleDone?.(day.day)}
                sx={{ position: 'absolute', top: 14, right: 14, color: textColor }}
              >
                {done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
              </IconButton>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0}>
                <Box sx={{ minWidth: { sm: 170 }, flexShrink: 0 }}>
                  <Typography
                    variant="h3"
                    sx={{ fontSize: '1.5rem', color: textColor, fontFamily: '"Special Gothic Expanded One", sans-serif' }}
                  >
                    {weekday || day.day}
                  </Typography>
                  {dateLabel && (
                    <Typography variant="body2" sx={{ color: mutedColor, fontWeight: 600 }}>
                      {dateLabel}
                    </Typography>
                  )}
                  {day.healthTip && (
                    <Typography variant="body2" sx={{ display: 'block', color: mutedColor, mt: 1 }}>
                      {day.healthTip}
                    </Typography>
                  )}
                  {day.exerciseTip && (
                    <Typography variant="body2" sx={{ display: 'block', color: mutedColor, mt: 1, fontStyle: 'italic' }}>
                      {day.exerciseTip}
                    </Typography>
                  )}
                </Box>

                {/* Vertical divider — desktop only */}
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ display: { xs: 'none', sm: 'block' }, borderColor: dividerColor, borderLeft: '1.5px solid', mx: 3.5 }}
                />
                {/* Horizontal divider — mobile only, stacked layout */}
                <Divider
                  orientation="horizontal"
                  sx={{ display: { xs: 'block', sm: 'none' }, borderColor: dividerColor, my: 2 }}
                />

                {/* Right: meals */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: dividerColor }} />}>
                    {MEAL_ORDER.map((mealKey) => {
                      const meal = day.meals?.[mealKey];
                      if (!meal) return null;
                      return (
                        <MealRow
                          key={mealKey}
                          mealKey={mealKey}
                          meal={meal}
                          textColor={textColor}
                          mutedColor={mutedColor}
                        />
                      );
                    })}
                  </Stack>
                  {day.coachNote && (
                    <Typography variant="body2" sx={{ display: 'block', mt: 1.5, color: mutedColor, fontStyle: 'italic' }}>
                      "{day.coachNote}"
                    </Typography>
                  )}
                </Box>
              </Stack>
            </MotionBox>
          );
        })}
      </Stack>
    </motion.div>
  );
}