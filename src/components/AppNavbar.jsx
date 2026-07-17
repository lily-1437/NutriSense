import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Box, Button, Typography, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Analyze', path: '/analyze' },
  { label: 'Meal Plans', path: '/meal-plans' },
  { label: 'Goals', path: '/goals' },
  { label: 'About', path: '/about' },
];

export default function AppNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:900px)');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AppBar
      position="fixed"
      elevation={scrolled ? 2 : 0}
      sx={{
        bgcolor: scrolled ? 'rgba(63, 71, 40, 0.9)' : 'transparent',
        transition: 'background-color 250ms ease, box-shadow 250ms ease',
        boxShadow: scrolled ? undefined : 'none',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          onClick={() => navigate('/')}
          sx={{
            fontFamily: '"Special Gothic Expanded One", sans-serif',
            color: '#F0EADC',
            cursor: 'pointer',
            fontSize: 23,
          }}
        >
          NutriSense
        </Typography>

        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 3 }}>
            {NAV_LINKS.map((link) => (
              <Button
                key={link.path}
                onClick={() => navigate(link.path)}
                sx={{
                  color: '#fff9e6',
                  textTransform: 'none',
                  fontFamily: '"Special Gothic", sans-serif',
                  fontWeight: 'bold',
                  transition: 'color 200ms ease',
                  '&:hover': { color: '#FFD95E' },
                }}
              >
                {link.label}
              </Button>
            ))}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
