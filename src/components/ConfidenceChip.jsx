import { Box, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

/**
 * Shared confidence-coded chip.
 * level: 'high' | 'medium' | 'low'
 * groupId: id shared by every chip in the same candidate row (e.g. the
 *   ingredient's id). Scopes the `layoutId` fill so the selected-state glide
 *   only animates between chips in the SAME row, not across ingredients.
 *   Wrap each row in <LayoutGroup id={ing.id}> from the parent — see
 *   RecipeInput.jsx Stage 2.
 * Reused as-is in Increment 4's Simulator per the UI Component Guide.
 *
 * Implementation note: MUI's <Chip> doesn't reliably render arbitrary
 * children (it's built around label/icon/deleteIcon props), so the
 * layout-animated fill lives in a sibling <motion.span> inside a relatively
 * positioned wrapper, not inside the Chip itself. The Chip's own background
 * stays transparent; the wrapper's motion.span is what glides.
 */
export default function ConfidenceChip({ label, level, selected = false, onClick, groupId }) {
  const config = {
    high: {
      color: '#576238', // Verdigris
      icon: <CheckCircle2 size={16} color={selected ? '#F0EADC' : '#576238'} />,
    },
    medium: {
      color: '#FFD95E', // Dandelion
      icon: <HelpCircle size={16} color={selected ? '#3F4728' : '#E0BA3F'} />,
    },
    low: {
      color: '#8D844D', // Shadow
      icon: <AlertTriangle size={16} color={selected ? '#F0EADC' : '#8D844D'} />,
    },
  }[level] ?? { color: '#8D844D', icon: null };

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', borderRadius: '16px', overflow: 'hidden' }}>
      {selected && groupId && (
        <motion.span
          layoutId={`${groupId}-chip-fill`}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            backgroundColor: config.color,
            zIndex: 0,
          }}
        />
      )}
      <Chip
        label={label}
        icon={config.icon}
        onClick={onClick}
        variant={selected ? 'filled' : 'outlined'}
        sx={{
          position: 'relative',
          zIndex: 1,
          borderColor: config.color,
          color: selected ? '#F0EADC' : config.color,
          bgcolor: 'transparent',
          fontFamily: '"Special Gothic", sans-serif',
          transition: 'color 200ms ease',
          '&:hover': {
            bgcolor: selected ? 'transparent' : `${config.color}22`,
          },
          '& .MuiChip-icon': { ml: 1 },
        }}
      />
    </Box>
  );
}
