import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import RecipeInput from './components/RecipeInput';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RecipeInput />
    </ThemeProvider>
  );
}

export default App;