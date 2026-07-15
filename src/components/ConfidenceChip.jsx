import { Chip } from '@mui/material';
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

/**
 * Shared confidence-coded chip.
 * level: 'high' | 'medium' | 'low'
 * Reused as-is in Increment 4's Simulator per the UI Component Guide.
 */
export default function ConfidenceChip({ label, level, selected = false, onClick }) {
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
    <Chip
      label={label}
      icon={config.icon}
      onClick={onClick}
      variant={selected ? 'filled' : 'outlined'}
      sx={{
        borderColor: config.color,
        color: selected ? undefined : config.color,
        bgcolor: selected ? config.color : 'transparent',
        fontFamily: '"Special Gothic", sans-serif',
        transition: 'background-color 200ms ease, color 200ms ease',
        '&:hover': {
          bgcolor: selected ? config.color : `${config.color}22`,
        },
        '& .MuiChip-icon': { ml: 1 },
      }}
    />
  );
}
