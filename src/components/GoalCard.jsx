// src/components/GoalCard.jsx
import { useState } from 'react';
import { Card, CardContent, Typography, Chip, IconButton, Menu, MenuItem, LinearProgress, Box } from '@mui/material';
import { MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { deleteGoal, updateGoal } from '../logic/firestoreGoals';

export default function GoalCard({ goal, currentCalories = 0, onChanged }) {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const progress = Math.min((currentCalories / goal.targetCalories) * 100, 100);

  const handleDelete = async () => {
    await deleteGoal(user.uid, goal.id);
    setAnchorEl(null);
    onChanged?.();
  };

  const handleComplete = async () => {
    await updateGoal(user.uid, goal.id, { status: 'completed' });
    setAnchorEl(null);
    onChanged?.();
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
      <Card sx={{ borderRadius: '25px', bgcolor: 'background.paper' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip
              label={goal.status}
              size="small"
              sx={{ bgcolor: goal.status === 'active' ? 'primary.main' : 'accent.main', color: goal.status === 'active' ? '#F0EADC' : '#3F4728' }}
            />
            <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVertical size={18} />
            </IconButton>
          </Box>

          <Typography variant="body1" sx={{ mt: 1 }}>
            {goal.targetCalories} kcal / {goal.timeframe}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            P {goal.targetProtein}g · F {goal.targetFat}g · C {goal.targetCarbs}g
          </Typography>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 2, height: 8, borderRadius: 4, bgcolor: '#F0EADC',
              '& .MuiLinearProgress-bar': { bgcolor: progress < 100 ? 'primary.main' : 'accent.main' } }}
          />

          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={handleComplete}>Mark Completed</MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: 'secondary.main' }}>Delete</MenuItem>
          </Menu>
        </CardContent>
      </Card>
    </motion.div>
  );
}