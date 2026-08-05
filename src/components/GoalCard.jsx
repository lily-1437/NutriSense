// src/components/GoalCard.jsx
// Active Goals dashboard card (State 3 of the redesign). A circular toggle
// on the left marks the goal complete/active; the exit/enter animation is
// driven from HealthGoals.jsx via AnimatePresence + `goalCompleteExit` /
// `goalUndoEnter` (variants.js) so the slide-out-right-and-fade happens at
// the list level, not inside this component.

import { useState } from 'react';
import { Typography, Chip, IconButton, Menu, MenuItem, LinearProgress, Box } from '@mui/material';
import { MoreVertical, Check, CalendarDays, ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { deleteGoal, markGoalComplete, markGoalActive } from '../logic/firestoreGoals';
import { cardLiftHover, cardLiftTransition } from '../motion/variants';

function formatDate(d) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function timeProgress(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100);
}

export default function GoalCard({ goal, onChanged, onOpenDetail }) {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const isCompleted = goal.status === 'completed';
  const progress = timeProgress(goal.startDate, goal.endDate);
  const milestoneCount = Array.isArray(goal.milestones) ? goal.milestones.length : 0;

  const handleDelete = async () => {
    await deleteGoal(user.uid, goal.id);
    setAnchorEl(null);
    onChanged?.();
  };

  const handleToggle = async () => {
    if (isCompleted) {
      await markGoalActive(user.uid, goal.id);
    } else {
      await markGoalComplete(user.uid, goal.id);
    }
    onChanged?.();
  };

  return (
    <motion.div
      layout
      onClick={() => onOpenDetail?.(goal)}
      whileHover={cardLiftHover}
      transition={cardLiftTransition}
      style={{
        borderRadius: '25px',
        background: '#FFFFFF',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        cursor: 'pointer',
      }}
    >
      {/* Circular completion toggle */}
      <motion.button
        onClick={(e) => { e.stopPropagation(); handleToggle(); }}
        whileTap={{ scale: 0.9 }}
        style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: isCompleted ? 'none' : '2px solid #6B6550',
          background: isCompleted ? '#637239' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginTop: 2,
        }}
        aria-label={isCompleted ? 'Mark as active' : 'Mark as completed'}
      >
        {isCompleted && <Check size={16} color="#F0EADC" strokeWidth={3} />}
      </motion.button>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                textDecoration: isCompleted ? 'line-through' : 'none',
                opacity: isCompleted ? 0.6 : 1,
              }}
            >
              {goal.targetName || 'Untitled goal'}
            </Typography>
            {goal.description && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {goal.description}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Chip
              label={isCompleted ? 'Completed' : 'Active'}
              size="small"
              sx={{
                bgcolor: isCompleted ? 'accent.main' : 'primary.main',
                color: isCompleted ? '#3F4728' : '#F0EADC',
                fontWeight: 600,
                fontSize: 11,
              }}
            />
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
              <MoreVertical size={17} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }} onClick={(e) => e.stopPropagation()}>
          {(goal.startDate || goal.endDate) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarDays size={13} color="#6B6550" />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatDate(goal.startDate) || '\u2014'} \u2192 {formatDate(goal.endDate) || '\u2014'}
              </Typography>
            </Box>
          )}
          {milestoneCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ListChecks size={13} color="#6B6550" />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {milestoneCount} milestone{milestoneCount === 1 ? '' : 's'}
              </Typography>
            </Box>
          )}
        </Box>

        {progress !== null && !isCompleted && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 1.5, height: 6, borderRadius: 3, bgcolor: '#F0EADC',
              '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: 3 },
            }}
          />
        )}

        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)} onClick={(e) => e.stopPropagation()}>
          <MenuItem onClick={handleToggle}>
            {isCompleted ? 'Mark Active' : 'Mark Completed'}
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'secondary.main' }}>Delete</MenuItem>
        </Menu>
      </Box>
    </motion.div>
  );
}
