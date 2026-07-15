import { useState, useMemo } from 'react';
import {
  Box, Container, TextField, Button, CircularProgress, Typography,
  List, ListItem, ListItemText, Collapse, Paper, Slide, Grid,
  Card, CardContent, Accordion, AccordionSummary, AccordionDetails,
  Table, TableHead, TableRow, TableCell, TableBody, Snackbar, Alert,
} from '@mui/material';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ConfidenceChip from './ConfidenceChip';

// ---- Confirmed analyzeRecipe.js / calculateNutrition.js interface ----
// prepareRecipeAnalysis(rawText: string) => Array<{
//   original: { quantity, unit, ingredientName, prepNote, raw },
//   candidates: Array<{ fdc_id, name, matchScore, confidence: 'high'|'medium'|'low', ...nutritionFields }>
// }>
// finalizeNutrition(confirmedSelections, servings?) => {
//   perIngredient: Array<{ ingredientName, matchedName, grams, ...nutritionFields }>,
//   totals: { calories, protein, carbs, fat, sat_fat, fiber, sugar, sodium },
//   perServing: { ...same fields as totals },
// }
import { prepareRecipeAnalysis, finalizeNutrition } from '../logic/analyzeRecipe';

const MACRO_COLORS = {
  protein: '#576238', // Verdigris
  fat: '#FFD95E',     // Dandelion
  carbs: '#8D844D',   // Shadow
};

// Extra per-100g fields calculateNutrition.js returns on `totals`/`perServing`,
// beyond the four headline macros shown in the summary cards.
const MICRO_LABELS = {
  sat_fat: 'Saturated Fat (g)',
  fiber: 'Fiber (g)',
  sugar: 'Sugar (g)',
  sodium: 'Sodium (mg)',
};

export default function RecipeInput() {
  const [stage, setStage] = useState('input'); // 'input' | 'confirm' | 'results'
  const [rawText, setRawText] = useState('');
  const [servings, setServings] = useState(1);
  const [isParsing, setIsParsing] = useState(false);
  const [ingredients, setIngredients] = useState([]); // Stage 2 state
  const [expandedId, setExpandedId] = useState(null);
  const [nutrition, setNutrition] = useState(null); // Stage 3 state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const allResolved = useMemo(
    () => ingredients.length > 0 && ingredients.every((ing) => ing.selectedMatchId),
    [ingredients]
  );

  // ---- Stage 1: Input ----
  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    try {
      // prepareRecipeAnalysis is synchronous; wrapped in try/catch only,
      // no await needed. Add client-side id/selectedMatchId, since the
      // raw parse+match output doesn't include UI selection state.
      const parsed = prepareRecipeAnalysis(rawText).map((entry, idx) => ({
        id: String(idx),
        original: entry.original,
        candidates: entry.candidates,
        selectedMatchId: null,
      }));
      setIngredients(parsed);
      setStage('confirm');
    } catch (err) {
      setSnackbar({ open: true, message: 'Could not parse recipe. Check formatting and try again.', severity: 'error' });
    } finally {
      setIsParsing(false);
    }
  };

  // ---- Stage 2: Match Confirmation ----
  const handleSelectMatch = (ingredientId, matchId) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === ingredientId ? { ...ing, selectedMatchId: matchId } : ing))
    );
  };

  const handleConfirmMatches = () => {
    try {
      const confirmedSelections = ingredients.map((ing) => ({
        original: ing.original,
        matchedItem: ing.candidates.find((c) => c.fdc_id === ing.selectedMatchId) ?? null,
      }));
      const result = finalizeNutrition(confirmedSelections, servings);
      setNutrition(result);
      setStage('results');
      setSnackbar({ open: true, message: 'Matches confirmed', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Could not calculate nutrition. Please try again.', severity: 'error' });
    }
  };

  // ---- Stage 3: Reset ----
  const handleReset = () => {
    setRawText('');
    setServings(1);
    setIngredients([]);
    setNutrition(null);
    setStage('input');
  };

  const macroChartData = nutrition
    ? [
        { name: 'Protein', value: nutrition.perServing.protein, key: 'protein' },
        { name: 'Fat', value: nutrition.perServing.fat, key: 'fat' },
        { name: 'Carbs', value: nutrition.perServing.carbs, key: 'carbs' },
      ]
    : [];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="md">

        {/* ---------- Stage 1: Input ---------- */}
        <Slide direction="left" in={stage === 'input'} mountOnEnter unmountOnExit>
          <Box>
            <Card sx={{ borderRadius: '16px', maxWidth: 640, mx: 'auto', p: 1 }} elevation={1}>
              <CardContent>
                <Typography
                  variant="h3"
                  sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif', mb: 2, color: 'text.primary' }}
                >
                  Analyze a Recipe
                </Typography>
                <TextField
                  multiline
                  minRows={8}
                  fullWidth
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  label="Paste your recipe ingredients"
                  helperText="One ingredient per line works best"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'text.secondary' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                    },
                  }}
                />
                <TextField
                  type="number"
                  label="Servings"
                  value={servings}
                  onChange={(e) => setServings(Math.max(1, Number(e.target.value) || 1))}
                  inputProps={{ min: 1 }}
                  sx={{ mt: 2, width: 120 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    disabled={!rawText.trim() || isParsing}
                    onClick={handleParse}
                    sx={{
                      bgcolor: 'primary.main',
                      color: '#F0EADC',
                      borderRadius: '20px',
                      px: 3,
                      transition: 'background-color 200ms ease',
                      '&:hover': { bgcolor: 'secondary.main' },
                    }}
                  >
                    {isParsing ? <CircularProgress size={20} sx={{ color: '#F0EADC' }} /> : 'Parse Recipe'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Slide>

        {/* ---------- Stage 2: Match Confirmation ---------- */}
        <Slide direction="left" in={stage === 'confirm'} mountOnEnter unmountOnExit>
          <Box>
            <Card sx={{ borderRadius: '16px' }} elevation={1}>
              <CardContent>
                <Typography variant="h3" sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif', mb: 2 }}>
                  Confirm Ingredient Matches
                </Typography>
                <List>
                  {ingredients.map((ing) => (
                    <ListItem
                      key={ing.id}
                      onClick={() => setExpandedId(expandedId === ing.id ? null : ing.id)}
                      sx={{ flexDirection: 'column', alignItems: 'stretch', borderBottom: '1px solid #F0EADC', cursor: 'pointer' }}
                    >
                      <ListItemText
                        primary={ing.original.raw}
                        secondary={
                          ing.candidates.find((c) => c.fdc_id === ing.selectedMatchId)?.name ?? 'No match selected'
                        }
                      />
                      <Collapse in={expandedId === ing.id || !ing.selectedMatchId}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 1, pb: 2 }}>
                          {ing.candidates.map((match) => (
                            <ConfidenceChip
                              key={match.fdc_id}
                              label={match.name}
                              level={match.confidence}
                              selected={ing.selectedMatchId === match.fdc_id}
                              onClick={() => handleSelectMatch(ing.id, match.fdc_id)}
                            />
                          ))}
                        </Box>
                      </Collapse>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Paper
              elevation={2}
              sx={{ position: 'sticky', bottom: 16, mt: 2, p: 2, display: 'flex', justifyContent: 'flex-end', borderRadius: '16px' }}
            >
              <Button
                variant="contained"
                disabled={!allResolved}
                onClick={handleConfirmMatches}
                sx={{
                  bgcolor: allResolved ? 'primary.main' : '#8D844D',
                  color: '#F0EADC',
                  borderRadius: '20px',
                  px: 3,
                }}
              >
                Confirm Matches
              </Button>
            </Paper>
          </Box>
        </Slide>

        {/* ---------- Stage 3: Results ---------- */}
        <Slide direction="left" in={stage === 'results'} mountOnEnter unmountOnExit>
          <Box>
            {nutrition && (
              <>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Per serving ({servings} {servings === 1 ? 'serving' : 'servings'} total)
                </Typography>

                {/* 1. Nutrition summary */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {['calories', 'protein', 'fat', 'carbs'].map((key) => (
                    <Grid item xs={6} sm={3} key={key}>
                      <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 1 }} elevation={1}>
                        <CardContent>
                          <Typography variant="h4" sx={{ color: 'primary.dark', fontFamily: '"Special Gothic Expanded One", sans-serif' }}>
                            {Math.round(nutrition.perServing[key])}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                            {key === 'calories' ? 'Calories' : `${key} (g)`}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* 2. Medical risk badge placeholder — wired in Increment 3 */}
                {/* <MedicalRiskBadge flags={riskFlags} /> */}

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {/* 3. Macro chart */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: '16px', p: 1 }} elevation={1}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Macronutrient Breakdown</Typography>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={macroChartData}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={80}
                              isAnimationActive
                              animationDuration={400}
                            >
                              {macroChartData.map((entry) => (
                                <Cell key={entry.key} fill={MACRO_COLORS[entry.key]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* 4. Substitution suggestions placeholder — Increment 3 */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: '16px', p: 1, opacity: 0.6 }} elevation={1}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>Suggested Substitutions</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Available once condition-aware substitution ships in Increment 3.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* 5. Micronutrient table, collapsed by default */}
                <Accordion sx={{ borderRadius: '16px', mb: 2 }}>
                  <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                    <Typography variant="subtitle1">Micronutrient Detail</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                          <TableCell>Nutrient</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(MICRO_LABELS).map(([key, label]) => (
                          <TableRow key={key}>
                            <TableCell>{label}</TableCell>
                            <TableCell align="right">{nutrition.perServing[key]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionDetails>
                </Accordion>

                {/* 6. Reset */}
                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="text"
                    startIcon={<RotateCcw size={16} />}
                    onClick={handleReset}
                    sx={{ color: 'accent.main' }}
                  >
                    Analyze another
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Slide>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
