// src/components/MedicalRiskBadge.jsx
//
// Increment 3: renders the risk flags produced by riskFlagging.js's
// flagRisks() as a row of badges. Placed directly below NutritionSummary
// in Stage 3 results (and reused as-is in RecipeDetails.jsx for saved
// recipes), per the UI guide's Stage 3 ordering.
//
// Severity styling follows the 4-color system's risk treatment exactly:
//   high   -> Shadow fill/border + bold filled AlertTriangle icon + one-shot
//             pulse on first appearance of a NEW high-severity flag
//   medium -> Dandelion-toned badge, outline AlertTriangle
//   low    -> Verdigris-toned badge (still flagged, lowest urgency), outline icon
//
// Nothing renders if flags is empty -- this component is silent by design
// when there's nothing to warn about (no conditions set, or a clean recipe).

import { useEffect, useState, useRef } from 'react';
import { Box, Chip, Tooltip, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const SEVERITY_STYLE = {
  high: {
    icon: { size: 22, strokeWidth: 2.5, filled: true },
    paletteKey: 'secondary', // Shadow — reserved for the boldest risk treatment
    boldBorder: true,
  },
  medium: {
    icon: { size: 18, strokeWidth: 2, filled: false },
    paletteKey: 'accent', // Dandelion — caution
    boldBorder: false,
  },
  low: {
    icon: { size: 16, strokeWidth: 2, filled: false },
    paletteKey: 'primary', // Verdigris — lowest urgency, still worth noting
    boldBorder: false,
  },
};

function RiskChip({ flag }) {
  const style = SEVERITY_STYLE[flag.severity] ?? SEVERITY_STYLE.low;
  const label = flag.type === 'ingredient'
    ? `${flag.ingredientName} — ${flag.condition}`
    : `${flag.condition}: high ${flag.nutrientKey}`;

  // One-shot pulse only for a genuinely NEW high-severity flag appearing --
  // tracked via a ref so it never re-fires on re-render of an already-seen
  // flag (avoids alarm fatigue, per the UI guide's §0.5 rule).
  const hasPulsed = useRef(false);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (flag.severity === 'high' && !hasPulsed.current) {
      hasPulsed.current = true;
      setPulseKey((k) => k + 1);
    }
  }, [flag.severity]);

  return (
    <motion.div
      key={pulseKey}
      animate={flag.severity === 'high' && pulseKey > 0 ? { opacity: [1, 0.6, 1] } : {}}
      transition={{ duration: 0.6, times: [0, 0.5, 1], repeat: 0 }}
    >
      <Tooltip title={flag.message} arrow>
        <Chip
          icon={
            <AlertTriangle
              size={style.icon.size}
              strokeWidth={style.icon.strokeWidth}
              fill={style.icon.filled ? undefined : 'none'}
            />
          }
          label={label}
          sx={{
            bgcolor: (t) => alpha(t.palette[style.paletteKey].main, 0.14),
            color: (t) => t.palette[style.paletteKey].dark,
            fontWeight: flag.severity === 'high' ? 700 : 600,
            border: style.boldBorder ? '2px solid' : '1px solid',
            borderColor: `${style.paletteKey}.main`,
            '& .MuiChip-icon': {
              color: (t) => t.palette[style.paletteKey].main,
            },
          }}
        />
      </Tooltip>
    </motion.div>
  );
}

export default function MedicalRiskBadge({ flags }) {
  if (!flags?.length) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
      {flags.map((flag, i) => (
        <RiskChip key={`${flag.condition}-${flag.type}-${i}`} flag={flag} />
      ))}
    </Box>
  );
}
