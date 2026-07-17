import { Box, Container, Typography, Button, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import WaveDivider from './WaveDivider';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: '75vh', md: '95vh' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundImage:
          'linear-gradient(180deg, rgba(6, 77, 66, 0.35), rgba(52, 71, 6, 0.15)), url(/hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg" sx={{ textAlign: 'left' , pl: { xs: 2, lg: 6 }}}>
        <Fade in timeout={400}>
          <Typography
            variant="h1"
            sx={{
              fontFamily: '"Special Gothic Expanded One", sans-serif',
              fontWeight: 100,
              color: '#FFFFFF',
              fontSize: { xs: 40, md: 72 },
              textShadow: '0 2px 16px rgba(0,0,0,0.3)',
            }}
          >
            Better meals. 
            Better habits. 
            A {' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: '#ccdf5e'}}>
              healthier 
            </Box>
             you
          </Typography>
        </Fade>

        <Fade in timeout={600}>
          <Box sx={{ mt: 3 }}>
            <Button
              onClick={() => navigate('/analyze')}
              sx={{
                bgcolor: '#cef046',
                color: '#151b06',
                border: '2px solid #455715',
                borderRadius: '15px',
                px: 3.5,
                py: 1.2,
                textTransform: 'none',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 'bold',
                transition: 'transform 150ms ease, background-color 150ms ease',
                '&:hover': { bgcolor: '#475611', color: '#fcf8ed', border: '2px solid #f4fad2', transform: 'scale(1.03)' },
              }}
            >
              Analyze Recipe
            </Button>
          </Box>
        </Fade>
      </Container>

      <WaveDivider toColor="#FAF3E7" />
    </Box>
  );
}
