// src/components/NutritionDifference.jsx
import { useEffect } from 'react';
import { Card, Stack, Typography, Box } from '@mui/material';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const LABELS = { calories: 'Calories', protein: 'Protein (g)', fat: 'Fat (g)', carbs: 'Carbs (g)' };

function CountUpDelta({ value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v * 10) / 10);

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.5, ease: 'easeOut' });
    return controls.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
}

export default function NutritionDifference({ delta }) {
  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 88,
      }}
    >
      <Typography variant="h3" sx={{ fontSize: '1.1rem', mb: 2 }}>
        What-if impact
      </Typography>
      <Stack spacing={1.5}>
        {Object.entries(LABELS).map(([key, label]) => {
          const val = delta[key] ?? 0;
          const improved = val < 0; // fewer calories/fat/carbs reads as "improvement" by default
          const isFlat = Math.abs(val) < 0.05;
          const color = isFlat ? 'text.secondary' : improved ? 'primary.main' : 'secondary.main';
          const Icon = isFlat ? Minus : improved ? TrendingDown : TrendingUp;

          return (
            <Stack key={key} direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body1" color="text.secondary">
                {label}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Icon size={16} color={`var(--mui-palette-${color.replace('.', '-')})`} />
                <Box component={Typography} variant="body1" sx={{ color, fontWeight: 600 }}>
                  {val > 0 ? '+' : ''}
                  <CountUpDelta value={val} />
                </Box>
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Card>
  );
}