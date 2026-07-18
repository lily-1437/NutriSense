import { createTheme } from '@mui/material/styles';

// NutriSense design system — Verdigris / Shadow / Dandelion / Ecru White.
// Only these four colors exist anywhere in the app; semantic meaning
// (safe/caution/risk) is carried by tone + icon, never a fifth hue.
const theme = createTheme({
  palette: {
    primary: {
      main: '#637239',       // Verdigris
      dark: '#475229',
      contrastText: '#F0EADC',
    },
    secondary: {
      main: '#8D844D',       // Shadow
      dark: '#6B6339',
      contrastText: '#F0EADC',
    },
    accent: {
      main: '#ffcd28',       // Dandelion
      dark: '#d4ad2d',
      contrastText: '#3F4728',
    },
    background: {
      default: '#F0EADC',    // Ecru White — page background everywhere
      paper: '#FFFFFF',      // near-white card surface, not a 5th color
    },
    text: {
      primary: '#3F4728',
      secondary: '#6B6550',
    },
  },
  typography: {
    fontFamily: '"Special Gothic", sans-serif',
    h1: { fontFamily: '"Special Gothic Expanded One", sans-serif', fontWeight: 400 },
    h2: { fontFamily: '"Special Gothic Expanded One", sans-serif', fontWeight: 400 },
    h3: { fontFamily: '"Special Gothic Expanded One", sans-serif', fontWeight: 400 },
    subtitle1: { fontFamily: '"Kameron", serif' },
    body1: { fontFamily: '"Kameron", serif' },
    caption: { fontFamily: '"Kameron", serif' },
  },
  shape: {
    borderRadius: 25, // matches card radius convention from the UI guide
  },
});

export default theme;
