import { Box, Container, Typography } from '@mui/material';

/**
 * SplitFeatureSection — reusable zigzag shell.
 * reverse=false: image left, content right (odd cards: 1st, 3rd, 5th...)
 * reverse=true:  image right, content left (even cards: 2nd, 4th, 6th...)
 */
export default function SplitFeatureSection({ image, heading, body, reverse = false, bgColor = '#DDEB8C' }) {
  return (
    <Box sx={{ bgcolor: bgColor, py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: { xs: 4, md: 6 },
            alignItems: 'center',
          }}
        >
          {/* Image placeholder */}
          <Box
            sx={{
              order: { xs: 1, md: reverse ? 2 : 1 },
              width: '100%',
              aspectRatio: '4 / 3',
              borderRadius: '24px',
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8a8a7a',
              fontSize: 14,
            }}
          >
            {image ?? 'Image placeholder'}
          </Box>

          {/* Content */}
          <Box sx={{ order: { xs: 2, md: reverse ? 1 : 2 } }}>
            <Typography
              variant="h3"
              sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif', color: '#3E4A1F', fontSize: 34, mb: 2 }}
            >
              {heading}
            </Typography>
            <Typography sx={{ fontFamily: '"Kameron", serif', color: '#4A4530', fontSize: 20, lineHeight: 1.7 }}>
              {body}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
