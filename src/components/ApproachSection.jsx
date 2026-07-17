import { Box, Container, Typography, Grid } from '@mui/material';
import { Sparkles } from 'lucide-react';

const PILLARS = [
  { label: 'More energy' },
  { label: 'Less guesswork' },
  { label: 'More vitality' },
];

export default function ApproachSection() {
  return (
    <Box sx={{ bgcolor: '#3E4A1F', py: { xs: 8, md: 10 }, textAlign: 'center', position: 'relative' }}>
      {/* Rolling-hills wave divider */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', lineHeight: 2 }}>
        <svg
          viewBox="0 0 1440 130"
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: 90 }}
        >
          <path
            d="
              M0,50
              C80,25 100,25 180,50
              C260,75 280,75 360,50
              C440,25 460,25 540,50
              C620,75 640,75 720,50
              C800,25 820,25 900,50
              C980,75 1000,75 1080,50
              C1160,25 1180,25 1260,50
              C1340,75 1360,75 1440,50
              L1440,-5
              L0,-5
              Z
            "
            fill="#DDEB8C"
          />
        </svg>
      </Box>

      <Container maxWidth="lg">
        <Typography
          variant="h2"
          sx={{
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            color: '#FAF3E7',
            fontSize: { xs: 24, md: 32 },
            mb: { xs: 5, md: 6 },
          }}
        >
          the{' '}
          <Box component="span" sx={{ fontStyle: 'italic', color: '#DDEB8C' }}>
            nutrisense
          </Box>{' '}
          approach
        </Typography>

        <Grid container justifyContent="center" spacing={{ xs: 4, md: 8 }}>
          {PILLARS.map((pillar) => (
            <Grid size={{ xs: 4 }} key={pillar.label}>
              <Sparkles size={32} color="#DDEB8C" strokeWidth={1.75} />
              <Typography sx={{ color: '#FAF3E7', fontSize: 13, mt: 1 }}>
                {pillar.label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}