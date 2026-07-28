// src/components/dashboard/AnalyticsCards.jsx
//
// The four top-row analytics cards: Today's Intake, Week's Intake Summary,
// Achieved Goals, Calories Burned. Each pulls color strictly from the
// 4-color NutriSense palette via theme tokens.

import { Box, Typography, useTheme } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Flame, Trophy } from 'lucide-react';

function CardShell({ title, children, sx }) {
  return (
    <Box
      sx={{
        borderRadius: '20px',
        bgcolor: 'background.paper',
        p: 2.25,
        height: '100%',
        ...sx,
      }}
    >
      <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: 'text.primary', mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

/* ---------------- Today's Intake ---------------- */
export function TodaysIntakeCard({ data }) {
  const theme = useTheme();
  const { calories, carbs, protein, fat } = data;
  const chartData = [
    { name: 'Calories', consumed: calories.consumed, target: calories.target },
    { name: 'Carbs', consumed: carbs.consumed, target: carbs.target },
    { name: 'Protein', consumed: protein.consumed, target: protein.target },
    { name: 'Fat', consumed: fat.consumed, target: fat.target },
  ];
  const pct = Math.round((calories.consumed / calories.target) * 100);

  return (
    <CardShell title="Today's Intake">
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 1 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'primary.dark' }}>
          {calories.consumed}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          / {calories.target} kcal · {pct}% of target
        </Typography>
      </Box>
      <Box sx={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10.5, fill: theme.palette.text.secondary }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: 'none',
                fontSize: 12,
                background: theme.palette.background.paper,
              }}
            />
            <Bar dataKey="consumed" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </CardShell>
  );
}

/* ---------------- Week's Intake Summary ---------------- */
export function WeekIntakeSummaryCard({ data }) {
  const theme = useTheme();
  const avg = Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length);
  const latest = data[data.length - 1].calories;
  const changePct = Math.round(((latest - avg) / avg) * 100);
  const up = changePct >= 0;

  return (
    <CardShell title="Week's Intake Summary">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'primary.dark' }}>
          {latest}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>kcal today</Typography>
        <Box
          sx={{
            ml: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 0.4,
            px: 1,
            py: 0.25,
            borderRadius: '999px',
            bgcolor: up ? 'background.default' : 'background.default',
            color: up ? 'secondary.dark' : 'primary.dark',
          }}
        >
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <Typography sx={{ fontSize: 11.5, fontWeight: 700 }}>
            {Math.abs(changePct)}% vs avg
          </Typography>
        </Box>
      </Box>
      <Box sx={{ height: 100 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="weekFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.secondary.main} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={theme.palette.background.default} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10.5, fill: theme.palette.text.secondary }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: 'none',
                fontSize: 12,
                background: theme.palette.background.paper,
              }}
            />
            <Area
              type="monotone"
              dataKey="calories"
              stroke={theme.palette.secondary.dark}
              strokeWidth={2}
              fill="url(#weekFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </CardShell>
  );
}

/* ---------------- Achieved Goals ---------------- */
export function AchievedGoalsCard({ data }) {
  const { completed, total, streakDays, todayPct } = data;
  const pct = Math.round((completed / total) * 100);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * pct) / 100;

  return (
    <CardShell title="Achieved Goals">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
          <svg width="84" height="84">
            <circle cx="42" cy="42" r={radius} stroke="#F0EADC" strokeWidth="8" fill="none" />
            <circle
              cx="42"
              cy="42"
              r={radius}
              stroke="#576238"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 42 42)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'primary.dark' }}>
              {pct}%
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary' }}>
            {completed}/{total}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 0.75 }}>
            goals completed
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Trophy size={13} color="#E0BA3F" />
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
              {streakDays}-day streak
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
            Today: {todayPct}% done
          </Typography>
        </Box>
      </Box>
    </CardShell>
  );
}

/* ---------------- Calories Burned ---------------- */
export function CaloriesBurnedCard({ data }) {
  const { burned, target, activeMinutes, workoutDurationMin } = data;
  const pct = Math.min(100, Math.round((burned / target) * 100));
  const aheadOfGoal = pct >= 100;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * pct) / 100;

  return (
    <CardShell title="Calories Burned">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
          <svg width="84" height="84">
            <circle cx="42" cy="42" r={radius} stroke="#F0EADC" strokeWidth="8" fill="none" />
            <circle
              cx="42"
              cy="42"
              r={radius}
              stroke="#8D844D"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 42 42)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={22} color="#8D844D" />
          </Box>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary' }}>
            {burned} <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>/ {target} kcal</Typography>
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 0.75 }}>
            {activeMinutes} active min · {workoutDurationMin} min workout
          </Typography>
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 600,
              color: aheadOfGoal ? 'primary.dark' : 'secondary.dark',
            }}
          >
            {aheadOfGoal ? "You're ahead of today's goal 🎉" : `${100 - pct}% to go today`}
          </Typography>
        </Box>
      </Box>
    </CardShell>
  );
}
