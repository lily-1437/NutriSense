import { Box, Container, Typography, Button, Fade, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf } from 'lucide-react';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        backgroundImage:
          'linear-gradient(180deg, rgba(63,71,40,0.75), rgba(63,71,40,0.9)), url(/hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#F0EADC',
      }}
    >
      <Container maxWidth="md">
        <Fade in timeout={400}>
          <Box>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'rgba(240,234,220,0.12)',
                border: '1px solid rgba(240,234,220,0.3)',
                borderRadius: '999px',
                px: 2,
                py: 0.5,
                mb: 3,
              }}
            >
              <Leaf size={16} color="#FFD95E" />
              <Typography variant="caption" sx={{ fontFamily: '"Special Gothic", sans-serif' }}>
                Condition-aware nutrition, powered by AI
              </Typography>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontFamily: '"Special Gothic Expanded One", sans-serif',
                fontSize: { xs: 40, md: 64 },
                lineHeight: 1.05,
                mb: 2,
              }}
            >
              Know exactly what's in your next meal
            </Typography>

            <Typography
              variant="body1"
              sx={{ fontFamily: '"Special Gothic", sans-serif', fontSize: 18, maxWidth: 520, mb: 4, opacity: 0.9 }}
            >
              Paste any recipe and get an instant nutrition breakdown, health
              risk flags, and AI-generated meal plans tailored to your goals
              and conditions.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                endIcon={<ArrowRight size={18} />}
                onClick={() => navigate('/analyze')}
                sx={{
                  bgcolor: '#576238',
                  color: '#F0EADC',
                  borderRadius: '999px',
                  px: 3,
                  py: 1.2,
                  textTransform: 'none',
                  fontFamily: '"Special Gothic", sans-serif',
                  transition: 'background-color 200ms ease',
                  '&:hover': { bgcolor: '#8D844D' },
                }}
              >
                Analyze a Recipe
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/about')}
                sx={{
                  borderColor: '#FFD95E',
                  color: '#FFD95E',
                  borderRadius: '999px',
                  px: 3,
                  py: 1.2,
                  textTransform: 'none',
                  fontFamily: '"Special Gothic", sans-serif',
                  transition: 'background-color 200ms ease, color 200ms ease',
                  '&:hover': { bgcolor: '#FFD95E', color: '#3F4728' },
                }}
              >
                Learn More
              </Button>
            </Box>
          </Box>
        </Fade>

        {/* Floating mission card, bottom-right per the reference layout */}
        <Paper
          elevation={4}
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            right: 40,
            bottom: 40,
            maxWidth: 260,
            p: 2.5,
            borderRadius: '16px',
            bgcolor: 'rgba(255,255,255,0.9)',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif', color: '#3F4728', mb: 0.5 }}>
            Our Mission
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: '"Special Gothic", sans-serif', color: '#6B6550' }}>
            Making nutrition analysis accessible, accurate, and personal to
            your health conditions — not just calorie counts.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
