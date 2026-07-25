// src/components/EmptyState.jsx
// Shared empty-state pattern per the UI Component Guide: icon + text + action
// button, mounted via fadeUp. Only the two text props and the button's
// destination/handler change per page — this stays one component, not one
// per page. See NutriSense_UI_Component_Guide.md's "Contextual empty states"
// table for per-page copy (Dashboard, Health Goals, History, Meal Planner,
// Simulator all reuse this).

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { fadeUp } from '../motion/variants';

const MotionButton = motion.button;

export default function EmptyState({ title, message, actionLabel, onAction, icon: Icon = Sparkles }) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderRadius: '25px',
          py: 6,
          px: 3,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Icon size={26} color="#576238" />
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Special Gothic Expanded One", sans-serif',
            fontSize: '1.25rem',
            color: 'text.primary',
            mb: 1,
          }}
        >
          {title}
        </Typography>

        {message && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 360 }}>
            {message}
          </Typography>
        )}

        {actionLabel && onAction && (
          <MotionButton
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={onAction}
            style={{
              background: '#576238',
              color: '#F0EADC',
              border: 'none',
              borderRadius: '25px',
              padding: '10px 22px',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            {actionLabel}
          </MotionButton>
        )}
      </Box>
    </motion.div>
  );
}
