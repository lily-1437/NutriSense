// src/components/FooterBar.jsx
//
// Simple footer bar for protected app routes (Goals, Profile, History,
// Meal Planner, Simulator, etc.) — brand name, nav links, copyright only.
// This is intentionally lightweight, unlike the marketing homepage's
// ApproachSection (which now contains the full image/stats footer) —
// protected pages shouldn't show that heavy marketing block.

import { Box, Container, Typography, Link as MuiLink } from '@mui/material';

const FOOTER_LINKS = [
  { label: 'Analyze', href: '/analyze' },
  { label: 'Meal Plans', href: '/meal-plans' },
  { label: 'Goals', href: '/goals' },
  { label: 'About', href: '/about' },
];

export default function FooterBar() {
  return (
    <Box sx={{ bgcolor: '#3E4A1F', color: '#F0EADC', py: 4 }}>
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif' }}>
          NutriSense
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {FOOTER_LINKS.map((link) => (
            <MuiLink
              key={link.href}
              href={link.href}
              underline="none"
              sx={{
                color: '#F0EADC',
                fontFamily: '"Kameron", serif',
                fontSize: 14,
                opacity: 0.85,
                '&:hover': { color: '#FFD95E' },
              }}
            >
              {link.label}
            </MuiLink>
          ))}
        </Box>
        <Typography variant="caption" sx={{ fontFamily: '"Special Gothic", sans-serif', opacity: 0.6 }}>
          © {new Date().getFullYear()} NutriSense. Academic capstone project.
        </Typography>
      </Container>
    </Box>
  );
}
