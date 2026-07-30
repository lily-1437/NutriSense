// src/components/ProfessionalConsultationAdvisory.jsx
//
// Increment 3: banner shown at the top of Stage 3 results, only when at
// least one risk flag is present for the user's saved conditions. Custom-
// styled Alert (not MUI's default severity colors, per the UI guide --
// stays inside the 4-color system). Persistent by default each time it
// mounts (not permanently dismissible), but collapsible per session via
// a simple expand/collapse toggle -- MUI's Collapse handles the animation
// natively, no Framer needed here.

import { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import { Info, ChevronUp, ChevronDown } from 'lucide-react';

export default function ProfessionalConsultationAdvisory({ flags }) {
  const [expanded, setExpanded] = useState(true);

  if (!flags?.length) return null;

  const highCount = flags.filter((f) => f.severity === 'high').length;

  return (
    <Box
      sx={{
        borderRadius: '16px',
        bgcolor: (t) => `${t.palette.secondary.main}1F`, // Shadow, ~12% tint
        border: '1px solid',
        borderColor: 'secondary.main',
        mb: 2.5,
        overflow: 'hidden',
      }}
    >
      <Box
        onClick={() => setExpanded((e) => !e)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          cursor: 'pointer',
        }}
      >
        <Info size={18} color="currentColor" style={{ color: 'inherit', flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: 'secondary.dark', flexGrow: 1 }}>
          {highCount > 0
            ? `This recipe has ${highCount} high-priority flag${highCount > 1 ? 's' : ''} based on your health conditions.`
            : 'This recipe has some considerations based on your health conditions.'}
        </Typography>
        <IconButton size="small" sx={{ color: 'secondary.dark' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 1.75, pt: 0 }}>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
            NutriSense flags ingredients and nutrient levels based on general guidance for the
            conditions you've saved to your profile. This is not medical advice — if you have
            questions about how this recipe fits your specific health needs, please consult a
            doctor, dietitian, or other qualified healthcare professional before making changes
            to your diet.
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}
