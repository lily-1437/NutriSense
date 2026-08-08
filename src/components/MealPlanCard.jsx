// src/components/MealPlanCard.jsx
import { useState } from 'react';
import { Box, Typography, Stack, Collapse, IconButton, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import {
  Coffee, UtensilsCrossed, Soup, Apple,
  CheckCircle2, ChevronDown, Flame,
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

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Anchors to the Monday of the week the plan was generated in, then offsets
// by the day's FIXED position in WEEKDAY_ORDER — never by its array index.
// This guarantees the date shown always corresponds to the actual day.day
// being displayed, regardless of what weekday the plan was generated on or
// what order plan.days happens to iterate in. (Previously this was derived
// from generatedAt + array index, which silently disagreed with day.day
// whenever the plan wasn't generated on a Monday — that's what caused the
// wrong day being deleted: the label shown and the key used by onComplete
// were two different values.)
function dateLabelFor(generatedAt, dayName) {
  const base = toDate(generatedAt);
  if (!base || Number.isNaN(base.getTime())) return null;

  const jsWeekday = base.getDay(); // 0=Sun..6=Sat
  const mondayOffset = jsWeekday === 0 ? -6 : 1 - jsWeekday;
  const monday = new Date(base);
  monday.setDate(monday.getDate() + mondayOffset);

  const dayIndex = WEEKDAY_ORDER.indexOf(dayName);
  if (dayIndex === -1) return null;

  const target = new Date(monday);
  target.setDate(target.getDate() + dayIndex);
  return target.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
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

// onComplete(day.day) — matches MealPlanner.jsx's handleRequestComplete,
// which hides the day immediately and starts the undo window. day.day is
// ALWAYS what's rendered as the visible weekday label (never a separately
// calculated one) so the label the user clicks under is guaranteed to match
// the key that gets deleted.
export default function MealPlanCard({ plan, onComplete, selectedDay, onSelectDay }) {
  return (
    <motion.div variants={staggerContainer(0.09)} initial="hidden" animate="visible">
      <Stack spacing={2.5}>
        {plan.days.map((day, i) => {
          const bg = DAY_PALETTE[i % DAY_PALETTE.length];
          const textColor = textColorFor(bg);
          const mutedColor = textColor === '#6B403B' ? 'rgba(107,64,59,0.68)' : 'rgba(247,221,213,0.8)';
          const dividerColor = textColor === '#6B403B' ? 'rgba(107,64,59,0.18)' : 'rgba(247,221,213,0.25)';
          const dateLabel = dateLabelFor(plan.generatedAt, day.day);
          const isSelected = selectedDay === day.day;

          return (
            <MotionBox
              key={day.day}
              layout
              variants={fadeUp}
              whileHover={{ y: -3, boxShadow: '0 14px 28px rgba(0,0,0,0.14)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={() => onSelectDay?.(day.day)}
              sx={{
                bgcolor: bg,
                borderRadius: '16px',
                border: '2px solid',
                borderColor: isSelected ? 'primary.dark' : 'rgba(78, 41, 37, 0.96)',
                p: { xs: 2.5, sm: 3.5 },
                position: 'relative',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 0 3px rgba(99,114,57,0.35)' : 'none',
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete?.(day.day);
                }}
                title="Mark day as done — removes it from your plan"
                sx={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  color: textColor,
                  zIndex: 2,
                }}
              >
                <CheckCircle2 size={22} />
              </IconButton>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0}>
                <Box sx={{ minWidth: { sm: 170 }, flexShrink: 0 }}>
                  <Typography
                    variant="h3"
                    sx={{ fontSize: '1.5rem', color: textColor, fontFamily: '"Special Gothic Expanded One", sans-serif' }}
                  >
                    {day.day}
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

                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ display: { xs: 'none', sm: 'block' }, borderColor: dividerColor, borderLeft: '1.5px solid', mx: 3.5 }}
                />
                <Divider
                  orientation="horizontal"
                  sx={{ display: { xs: 'block', sm: 'none' }, borderColor: dividerColor, my: 2 }}
                />

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
