// src/components/dashboard/WorkoutDetails.jsx

import { Box, Typography, Chip, Divider, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, Dumbbell, Target, Info } from 'lucide-react';

function Row({ icon: Icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1.5 }}>
      <Icon size={16} color="#6B6550" style={{ marginTop: 2 }} />
      <Box>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: 'text.primary' }}>{value}</Typography>
      </Box>
    </Box>
  );
}

export default function WorkoutDetails({ workout }) {
  if (!workout) {
    return (
      <Box
        sx={{
          borderRadius: '20px',
          bgcolor: 'background.paper',
          p: 3,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <Info size={22} color="#6B6550" style={{ marginBottom: 8 }} />
        <Typography sx={{ fontSize: 13.5 }}>
          Select a workout to see its details here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ borderRadius: '20px', bgcolor: 'background.paper', p: 2.5 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={workout.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <Typography
            sx={{
              fontFamily: '"Special Gothic Expanded One", sans-serif',
              fontSize: 16,
              color: 'text.primary',
              mb: 0.5,
            }}
          >
            {workout.name}
          </Typography>
          <Chip
            label={workout.category}
            size="small"
            sx={{ bgcolor: 'accent.main', color: 'accent.contrastText', fontWeight: 600, mb: 2 }}
          />

          <Divider sx={{ mb: 2, borderColor: 'background.default' }} />

          <Row icon={Target} label="Targeted muscle groups" value={workout.muscleGroups} />
          <Row icon={Clock} label="Duration" value={`${workout.durationMin} minutes`} />
          <Row icon={Flame} label="Estimated calories burned" value={`${workout.calories} kcal`} />
          <Row icon={Dumbbell} label="Equipment needed" value={workout.equipment} />

          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
              DIFFICULTY
            </Typography>
            <Chip
              label={workout.difficulty}
              size="small"
              sx={{ bgcolor: 'background.default', color: 'primary.dark', fontWeight: 600 }}
            />
          </Box>

          {workout.trainerNote && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: '14px',
                bgcolor: 'background.default',
              }}
            >
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'primary.dark', mb: 0.5 }}>
                TRAINER NOTE
              </Typography>
              <Typography sx={{ fontSize: 13, color: 'text.primary' }}>
                {workout.trainerNote}
              </Typography>
            </Box>
          )}

          {workout.status !== 'completed' && (
            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 2.5,
                borderRadius: '14px',
                bgcolor: 'primary.main',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: 'secondary.main' },
              }}
            >
              Mark as completed
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
