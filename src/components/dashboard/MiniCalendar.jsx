// src/components/dashboard/MiniCalendar.jsx
// Compact month calendar with current-day highlight and month navigation.

import { useState, useMemo } from 'react';
import { Box, IconButton, Typography, Grid } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_LABELS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

function buildMonthGrid(year, month) {
  // month is 0-indexed
  const firstOfMonth = new Date(year, month, 1);
  // Monday-first offset
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function MiniCalendar() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const cells = useMemo(
    () => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goPrev = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const isToday = (day) =>
    day &&
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth() &&
    day === today.getDate();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <IconButton size="small" onClick={goPrev} sx={{ color: 'text.secondary' }}>
          <ChevronLeft size={18} />
        </IconButton>
        <AnimatePresence mode="wait">
          <motion.div
            key={monthLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'text.primary' }}>
              {monthLabel}
            </Typography>
          </motion.div>
        </AnimatePresence>
        <IconButton size="small" onClick={goNext} sx={{ color: 'text.secondary' }}>
          <ChevronRight size={18} />
        </IconButton>
      </Box>

      <Grid container columns={7} sx={{ mb: 0.5 }}>
        {DAY_LABELS.map((d) => (
          <Grid item xs={1} key={d} sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 10.5, color: 'text.secondary', fontWeight: 600 }}>
              {d}
            </Typography>
          </Grid>
        ))}
      </Grid>

      <AnimatePresence mode="wait">
        <motion.div
          key={monthLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Grid container columns={7} rowSpacing={0.5}>
            {cells.map((day, i) => (
              <Grid item xs={1} key={i} sx={{ textAlign: 'center' }}>
                {day && (
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      mx: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      fontSize: 12,
                      fontWeight: isToday(day) ? 700 : 500,
                      color: isToday(day) ? '#F0EADC' : 'text.primary',
                      bgcolor: isToday(day) ? 'primary.main' : 'transparent',
                      cursor: 'default',
                    }}
                  >
                    {day}
                  </Box>
                )}
              </Grid>
            ))}
          </Grid>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
