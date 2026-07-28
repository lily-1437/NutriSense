import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function IntroSection() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#FAF3E7', py: { xs: 8, md: 12 } }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography
          sx={{

            fontSize: 12,
            letterSpacing: '0.12em',
            fontWeight: 600,
            color: '#5C6B2E',
            textTransform: 'uppercase',
            mb: 2,
          }}
        >
          Nutrition that makes sense
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontFamily: '"Special Gothic Expanded One", sans-serif',
            fontWeight: 400,
            color: '#3E4A1F',
            fontSize: { xs: 26, md: 36 },
            lineHeight: 1.3,
            mb: 2,
          }}
        >
          Paste a recipe, understand exactly what's in it
        </Typography>
        <Typography sx={{ color: '#4A4530', fontSize: 15, lineHeight: 1.7, mb: 4 }}>
          Healthy eating doesn't have to be complicated. Discover what's in your meals, understand your nutrition, and build habits that help you feel your best every day.
        </Typography>
        <Button
          onClick={() => navigate('/signup')}
          sx={{
            bgcolor: '#cef046',
            color: '#2F3817',
            border: '2px solid #455715',
            borderRadius: '15px',
            px: 3.5,
            py: 1.2,
            textTransform: 'none',
            fontFamily: '"Kameron", serif',
            fontSize: { xs: 12, md: 16 },
            fontWeight: 'bold',
            transition: 'transform 150ms ease, background-color 150ms ease',
            '&:hover': { bgcolor: '#475611', color: '#fcf8ed',transform: 'scale(1.03)' },
          }}
        >
          Get started
        </Button>
      </Container>
    </Box>
  );
}
