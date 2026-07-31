// src/components/NutritionSummary.jsx
// Extracted from RecipeInput.jsx's Stage 3 results block so Simulator.jsx
// (and any future page) can reuse the same stat-card + macro-chart display
// without pulling in RecipeInput's risk-flagging/save/reset state, which
// only makes sense in the Analyze Recipe flow.
//
// Accepts a `nutrition` object shaped like calculateNutrition.js's output:
// { totals: {...}, perServing: { calories, protein, fat, carbs, sat_fat, fiber, sugar, sodium } }

import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { fadeUp, staggerContainer, scaleIn } from '../motion/variants';

const MotionCard = motion.create(Card);

const MACRO_COLORS = {
  protein: '#576238', // Verdigris
  fat: '#FFD95E',     // Dandelion
  carbs: '#8D844D',   // Shadow
};

// ---- Count-up number (roadmap §7.8) ----
function CountUpNumber({ value, ...typographyProps }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.6, ease: 'easeOut' });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <Typography {...typographyProps}>{display}</Typography>;
}

export default function NutritionSummary({ nutrition }) {
  if (!nutrition?.perServing) return null;

  const macroChartData = [
    { name: 'Protein', value: nutrition.perServing.protein, key: 'protein' },
    { name: 'Fat', value: nutrition.perServing.fat, key: 'fat' },
    { name: 'Carbs', value: nutrition.perServing.carbs, key: 'carbs' },
  ];

  return (
    <Box>
      {/* Stat cards */}
      <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="visible">
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {['calories', 'protein', 'fat', 'carbs'].map((key) => (
            <Grid item xs={6} sm={3} key={key}>
              <motion.div variants={fadeUp}>
                <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 1 }} elevation={1}>
                  <CardContent>
                    <CountUpNumber
                      value={Math.round(nutrition.perServing[key])}
                      variant="h4"
                      sx={{ color: 'primary.dark', fontFamily: '"Special Gothic Expanded One", sans-serif' }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                      {key === 'calories' ? 'Calories' : `${key} (g)`}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Macro chart */}
      <MotionCard
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        sx={{ borderRadius: '16px', p: 1 }}
        elevation={1}
      >
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Macronutrient Breakdown</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={macroChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                isAnimationActive
                animationDuration={400}
              >
                {macroChartData.map((entry) => (
                  <Cell key={entry.key} fill={MACRO_COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </MotionCard>
    </Box>
  );
}