// src/components/GoalDetailDialog.jsx
// Read-only detail view for a single health goal, opened by tapping a
// GoalCard on the Health Goals dashboard. Shows the full description,
// date range, status, and every milestone (icon + label + detail + value),
// which the condensed list-card view doesn't have room for.

import { Dialog, DialogContent, Typography, Box, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import {
  Target, CalendarDays, ListChecks, Flame, Droplet, Utensils,
  Activity, Moon, TrendingDown, Heart,
} from 'lucide-react';
import { fadeUp, staggerContainer } from '../motion/variants';

const ICONS = { Flame, Droplet, Utensils, Activity, Moon, TrendingDown, Heart };

function formatDate(d) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function GoalDetailDialog({ goal, open, onClose }) {
  if (!goal) return null;
  const isCompleted = goal.status === 'completed';
  const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: '25px', bgcolor: 'background.paper' } } }}
    >
      <DialogContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 40, height: 40, borderRadius: '14px', bgcolor: 'background.default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <Target size={20} color="#637239" />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h3" sx={{ fontSize: '1.35rem', color: 'text.primary' }}>
                {goal.targetName || 'Untitled goal'}
              </Typography>
              <Chip
                label={isCompleted ? 'Completed' : 'Active'}
                size="small"
                sx={{
                  bgcolor: isCompleted ? 'accent.main' : 'primary.main',
                  color: isCompleted ? '#3F4728' : '#F0EADC',
                  fontWeight: 600, fontSize: 11,
                }}
              />
            </Box>
            {(goal.startDate || goal.endDate) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <CalendarDays size={14} color="#6B6550" />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formatDate(goal.startDate) || '\u2014'} \u2192 {formatDate(goal.endDate) || '\u2014'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {goal.description && (
          <Box sx={{ bgcolor: 'background.default', borderRadius: '16px', p: 2, mb: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {goal.description}
            </Typography>
          </Box>
        )}

        {goal.rationale && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            {goal.rationale}
          </Typography>
        )}

        {milestones.length > 0 && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <ListChecks size={16} color="#637239" />
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Milestones
              </Typography>
            </Box>

            <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="visible">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {milestones.map((m) => {
                  const Icon = ICONS[m.icon] || Heart;
                  return (
                    <motion.div key={m.id} variants={fadeUp}>
                      <Box
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1.5,
                          p: 1.75, borderRadius: '16px', bgcolor: 'background.paper',
                          border: '1px solid', borderColor: 'background.default',
                        }}
                      >
                        <Box
                          sx={{
                            width: 36, height: 36, borderRadius: '12px', flexShrink: 0,
                            bgcolor: 'background.default', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Icon size={17} color="#637239" />
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {m.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {m.detail}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', flexShrink: 0 }}>
                          {m.value} {m.unit}
                        </Typography>
                      </Box>
                    </motion.div>
                  );
                })}
              </Box>
            </motion.div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
