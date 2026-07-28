// src/components/dashboard/WorkoutCard.jsx

import { Box, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { Flame, Clock, CheckCircle2 } from 'lucide-react';

const statusStyles = {
  completed: { label: 'Completed', color: 'primary.main' },
  upcoming: { label: 'Upcoming', color: 'secondary.main' },
  today: { label: 'Today', color: 'accent.dark' },
};

export default function WorkoutCard({ workout, selected, onSelect }) {
  const Icon = workout.icon;
  const status = statusStyles[workout.status] ?? statusStyles.upcoming;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
      <Box
        onClick={() => onSelect(workout)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: '16px',
          cursor: 'pointer',
          bgcolor: selected ? 'background.default' : 'background.paper',
          border: '1px solid',
          borderColor: selected ? 'primary.main' : 'background.default',
          transition: 'border-color 160ms ease, background-color 160ms ease',
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            flexShrink: 0,
            borderRadius: '12px',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color="#F0EADC" />
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }} noWrap>
            {workout.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Clock size={12} color="#6B6550" />
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                {workout.time} · {workout.durationMin} min
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Flame size={12} color="#8D844D" />
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                {workout.calories} kcal
              </Typography>
            </Box>
          </Box>
        </Box>

        {workout.status === 'completed' ? (
          <CheckCircle2 size={18} color="#576238" />
        ) : (
          <Chip
            label={status.label}
            size="small"
            sx={{
              fontSize: 10.5,
              height: 22,
              bgcolor: 'background.default',
              color: status.color,
              fontWeight: 600,
            }}
          />
        )}
      </Box>
    </motion.div>
  );
}
