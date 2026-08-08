// src/components/NutritionScoreRow.jsx
import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../motion/variants';

const MotionBox = motion.create(Box);

const METRICS = [
  { key: 'calories', label: 'Calories', unit: '' },
  { key: 'protein', label: 'Protein (g)', unit: '' },
  { key: 'fat', label: 'Fat (g)', unit: '' },
  { key: 'carbs', label: 'Carbs (g)', unit: '' },
];

// totals: { calories, protein, fat, carbs } — any of these may be
// null/undefined if the underlying meal data doesn't have that field; we
// show "—" rather than a fabricated 0, so the card never implies a number
// we don't actually have.
export default function NutritionScoreRow({ totals, label }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, fontWeight: 600 }}>
        {label}
      </Typography>
      <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="visible">
        <Grid container spacing={2}>
          {METRICS.map((m) => {
            const value = totals?.[m.key];
            const hasValue = value !== null && value !== undefined;
            return (
              <Grid item xs={6} sm={3} key={m.key}>
                <MotionBox
                  variants={fadeUp}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: '16px',
                    p: 2.5,
                    textAlign: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Special Gothic Expanded One", sans-serif',
                      fontSize: '2rem',
                      color: 'primary.dark',
                      lineHeight: 1,
                    }}
                  >
                    {hasValue ? Math.round(value) : '—'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                    {m.label}
                  </Typography>
                </MotionBox>
              </Grid>
            );
          })}
        </Grid>
      </motion.div>
    </Box>
  );
}