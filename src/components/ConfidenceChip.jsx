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
 *
 * FIX: `color` (the fill/border accent) and text color used to be the same
 * value for every level. That's fine for high/low, whose accent colors are
 * dark enough to read — but medium's accent (#FFD95E, pale yellow) was
 * being used AS the text color too, in both states: pale-yellow-on-white
 * when unselected, and cream-on-pale-yellow when selected. Both are low
 * contrast and hard to read (this is what showed up as barely-visible
 * candidate chip text in the confirm-matches screen). Each level now has
 * its own `textColor`/`selectedTextColor`, independent of the accent used
 * for the border/fill, so medium gets a dark, readable color in both
 * states instead of reusing its own pale fill color as text.
 */
export default function ConfidenceChip({ label, level, selected = false, onClick, groupId }) {
  const config = {
    high: {
      color: '#576238', // Verdigris — accent/fill/border
      textColor: '#576238', // dark enough to read on white unselected
      selectedTextColor: '#F0EADC', // cream reads fine on dark green fill
      icon: <CheckCircle2 size={16} color={selected ? '#F0EADC' : '#576238'} />,
    },
    medium: {
      color: '#FFD95E', // Dandelion — accent/fill/border only, never used as text
      textColor: '#8A6D1F', // darker gold-brown — readable on white unselected
      selectedTextColor: '#3F4728', // dark olive — readable on the pale yellow fill
      icon: <HelpCircle size={16} color={selected ? '#3F4728' : '#8A6D1F'} />,
    },
    low: {
      color: '#8D844D', // Shadow — accent/fill/border
      textColor: '#6B633A', // slightly darker than the accent for better unselected contrast
      selectedTextColor: '#F0EADC', // cream reads fine on the olive-brown fill
      icon: <AlertTriangle size={16} color={selected ? '#F0EADC' : '#6B633A'} />,
    },
  }[level] ?? {
    color: '#8D844D',
    textColor: '#6B633A',
    selectedTextColor: '#F0EADC',
    icon: null,
  };

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
          color: selected ? config.selectedTextColor : config.textColor,
          bgcolor: 'transparent',
          fontFamily: '"Special Gothic", sans-serif',
          fontWeight: 600,
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
