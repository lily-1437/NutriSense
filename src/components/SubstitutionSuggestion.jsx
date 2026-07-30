// src/components/SubstitutionSuggestion.jsx
//
// Increment 3: renders the output of substitutionEngine.js's
// getSubstitutions(). Placed in Stage 3 results alongside the macro chart
// (position #4, per the UI guide), replacing the "available in Increment 3"
// placeholder card. Compact card list; each suggestion can expand inline
// to show the full reasoning via AnimatePresence fade+scale (matching the
// rest of the results page's motion language, rather than MUI's default
// Popover transition).
//
// Renders a quiet empty-state message (not null) when there are no
// suggestions -- unlike MedicalRiskBadge, this card's placement in the
// two-column layout means disappearing entirely would leave a lopsided
// gap next to the macro chart.

import { useState } from 'react';
import { Box, Card, CardContent, Typography, Collapse } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';

function SuggestionRow({ item }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      onClick={() => setExpanded((e) => !e)}
      sx={{
        borderRadius: '12px',
        bgcolor: 'background.default',
        p: 1.25,
        cursor: 'pointer',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', textDecoration: 'line-through' }}>
          {item.original}
        </Typography>
        <ArrowRight size={14} color="currentColor" style={{ opacity: 0.6 }} />
        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: 'primary.main' }}>
          {item.suggestion}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} />
        </motion.div>
      </Box>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.97, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.75 }}>
              {item.reason} <Box component="span" sx={{ fontWeight: 600 }}>({item.condition})</Box>
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

export default function SubstitutionSuggestion({ suggestions }) {
  return (
    <Card sx={{ borderRadius: '16px', p: 1, height: '100%' }} elevation={0}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          Suggested Substitutions
        </Typography>

        {!suggestions?.length ? (
          <Typography variant="body2" color="text.secondary">
            No substitutions needed for this recipe based on your saved conditions.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {suggestions.map((item, i) => (
              <SuggestionRow key={`${item.original}-${i}`} item={item} />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
