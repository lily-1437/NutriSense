import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import theme from './theme';
import Home from './pages/Home';
import RecipeInput from './components/RecipeInput';

// Simple placeholder for nav links that don't have a built page yet
// (Meal Plans, Goals, About land in later increments per the roadmap).
function ComingSoon({ label }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h3" sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif', color: 'text.primary' }}>
        {label} — coming soon
      </Typography>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<RecipeInput />} />
          <Route path="/meal-plans" element={<ComingSoon label="Meal Plans" />} />
          <Route path="/goals" element={<ComingSoon label="Goals" />} />
          <Route path="/about" element={<ComingSoon label="About" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
