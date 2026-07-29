import { useState, useMemo, useEffect } from 'react';
import {
  Box, Container, TextField, Button, CircularProgress, Typography,
  List, ListItem, ListItemText, Collapse, Paper, Grid,
  Card, CardContent, Accordion, AccordionSummary, AccordionDetails,
  Table, TableHead, TableRow, TableCell, TableBody, Snackbar, Alert,
} from '@mui/material';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform, animate } from 'framer-motion';
import ConfidenceChip from './ConfidenceChip';
import { fadeUp, staggerContainer, scaleIn } from '../motion/variants';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { saveRecipe, getRecipe } from '../logic/firestoreRecipes';

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

const MotionButton = motion(Button);
const MotionCard = motion(Card);

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

// ---- Stage transition variants (roadmap §7.5) ----
// The one place a directional motion is semantically correct: input -> confirm -> results
// are genuinely sequential steps in one flow.
const stageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

// ---- Count-up number (roadmap §7.8) ----
function CountUpNumber({ value, ...typographyProps }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.6, ease: 'easeOut' });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <Typography {...typographyProps}>{display}</Typography>;
}

export default function RecipeInput({ recipeId }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState('input'); // 'input' | 'confirm' | 'results'
  const [rawText, setRawText] = useState('');
  const [servings, setServings] = useState(1);
  const [isParsing, setIsParsing] = useState(false);
  const [ingredients, setIngredients] = useState([]); // Stage 2 state
  const [expandedId, setExpandedId] = useState(null);
  const [nutrition, setNutrition] = useState(null); // Stage 3 state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ---- History hydration (/history/:recipeId) ----
  // When a recipeId is passed in, load that saved recipe from Firestore and
  // jump straight to Stage 3, instead of showing a blank Stage 1.
  const [isHydrating, setIsHydrating] = useState(Boolean(recipeId));
  const [savedRecipeId, setSavedRecipeId] = useState(null); // set after a successful save this session
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!recipeId) {
      setIsHydrating(false);
      return;
    }
    if (!user) {
      // /history/:recipeId is behind ProtectedRoute, but guard anyway —
      // auth state may still be resolving on first mount.
      return;
    }
    let cancelled = false;
    setIsHydrating(true);
    getRecipe(user.uid, recipeId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setSnackbar({ open: true, message: 'Recipe not found.', severity: 'error' });
          setIsHydrating(false);
          return;
        }
        setRawText(data.rawInput ?? '');
        setServings(data.servings ?? 1);
        setNutrition({ totals: data.totals, perServing: data.perServing });
        setSavedRecipeId(data.id);
        setStage('results');
        setIsHydrating(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSnackbar({ open: true, message: 'Could not load this recipe.', severity: 'error' });
        setIsHydrating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recipeId, user]);

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

  // ---- Stage 3: Save to History ----
  const handleSaveToHistory = async () => {
    if (!user) {
      // Anonymous use is allowed through Stage 3; saving requires login.
      navigate('/login', { state: { from: { pathname: '/analyze' } } });
      return;
    }
    if (!nutrition) return;
    setIsSaving(true);
    try {
      const newId = await saveRecipe(user.uid, {
        recipeName: rawText.split('\n')[0]?.slice(0, 60) || 'Untitled recipe',
        rawInput: rawText,
        ingredients,
        totals: nutrition.totals,
        perServing: nutrition.perServing,
        servings,
      });
      setSavedRecipeId(newId);
      setSnackbar({ open: true, message: 'Saved to history', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Could not save recipe. Please try again.', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Stage 3: Reset ----
  const handleReset = () => {
    setRawText('');
    setServings(1);
    setIngredients([]);
    setNutrition(null);
    setSavedRecipeId(null);
    setStage('input');
  };

  const macroChartData = nutrition
    ? [
        { name: 'Protein', value: nutrition.perServing.protein, key: 'protein' },
        { name: 'Fat', value: nutrition.perServing.fat, key: 'fat' },
        { name: 'Carbs', value: nutrition.perServing.carbs, key: 'carbs' },
      ]
    : [];

  if (isHydrating) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="md">
        <AnimatePresence mode="wait">
          {stage === 'input' && (
            <motion.div
              key="input"
              variants={stageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* ---------- Stage 1: Input ---------- */}
              <MotionCard
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                sx={{ borderRadius: '16px', maxWidth: 640, mx: 'auto', p: 1 }}
                elevation={1}
              >
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
                    <MotionButton
                      variant="contained"
                      disabled={!rawText.trim() || isParsing}
                      onClick={handleParse}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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
                    </MotionButton>
                  </Box>
                </CardContent>
              </MotionCard>
            </motion.div>
          )}

          {stage === 'confirm' && (
            <motion.div
              key="confirm"
              variants={stageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* ---------- Stage 2: Match Confirmation ---------- */}
              <Card sx={{ borderRadius: '16px' }} elevation={1}>
                <CardContent>
                  <Typography variant="h3" sx={{ fontFamily: '"Special Gothic Expanded One", sans-serif', mb: 2 }}>
                    Confirm Ingredient Matches
                  </Typography>
                  <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="visible">
                    <List>
                      {ingredients.map((ing) => (
                        <motion.div key={ing.id} variants={fadeUp}>
                          <ListItem
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
                              {/* LayoutGroup scopes the chip-fill layoutId to this ingredient's row,
                                  so selecting a different candidate glides the fill within the row
                                  only — it never animates across rows (UI guide, MatchConfirmation). */}
                              <LayoutGroup id={ing.id}>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 1, pb: 2 }}>
                                  {ing.candidates.map((match) => (
                                    <ConfidenceChip
                                      key={match.fdc_id}
                                      groupId={ing.id}
                                      label={match.name}
                                      level={match.confidence}
                                      selected={ing.selectedMatchId === match.fdc_id}
                                      onClick={() => handleSelectMatch(ing.id, match.fdc_id)}
                                    />
                                  ))}
                                </Box>
                              </LayoutGroup>
                            </Collapse>
                          </ListItem>
                        </motion.div>
                      ))}
                    </List>
                  </motion.div>
                </CardContent>
              </Card>

              <Paper
                elevation={2}
                sx={{ position: 'sticky', bottom: 16, mt: 2, p: 2, display: 'flex', justifyContent: 'flex-end', borderRadius: '16px' }}
              >
                <MotionButton
                  variant="contained"
                  disabled={!allResolved}
                  onClick={handleConfirmMatches}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  sx={{
                    bgcolor: allResolved ? 'primary.main' : '#8D844D',
                    color: '#F0EADC',
                    borderRadius: '20px',
                    px: 3,
                  }}
                >
                  Confirm Matches
                </MotionButton>
              </Paper>
            </motion.div>
          )}

          {stage === 'results' && nutrition && (
            <motion.div
              key="results"
              variants={stageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* ---------- Stage 3: Results ---------- */}
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Per serving ({servings} {servings === 1 ? 'serving' : 'servings'} total)
              </Typography>

              {/* 1. Nutrition summary */}
              <motion.div variants={staggerContainer(0.08)} initial="hidden" animate="visible">
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {['calories', 'protein', 'fat', 'carbs'].map((key) => (
                    <Grid item xs={6} sm={3} key={key}>
                      <motion.div variants={fadeUp}>
                        <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 1 }} elevation={1}>
                          <CardContent>
                            <CountUpNumber
                              value={Math.round(nutrition.perServing[key])}
                              variant="h4"
                              sx={{ color: 'primary.dark', fontFamily: '"Special Gothic Expanded One", sans-serif' }}
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                              {key === 'calories' ? 'Calories' : `${key} (g)`}
                            </Typography>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>

              {/* 2. Medical risk badge placeholder — wired in Increment 3 */}
              {/* <MedicalRiskBadge flags={riskFlags} /> */}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* 3. Macro chart */}
                <Grid item xs={12} md={6}>
                  <MotionCard
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                    sx={{ borderRadius: '16px', p: 1 }}
                    elevation={1}
                  >
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
                  </MotionCard>
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

              {/* 6. Save to History + Reset */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <MotionButton
                  variant="contained"
                  onClick={handleSaveToHistory}
                  disabled={isSaving || Boolean(savedRecipeId)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  sx={{
                    bgcolor: savedRecipeId ? 'secondary.main' : 'primary.main',
                    color: '#F0EADC',
                    borderRadius: '20px',
                    px: 3,
                    '&:hover': { bgcolor: 'secondary.main' },
                  }}
                >
                  {isSaving ? (
                    <CircularProgress size={18} sx={{ color: '#F0EADC' }} />
                  ) : savedRecipeId ? (
                    'Saved!'
                  ) : user ? (
                    'Save to History'
                  ) : (
                    'Log in to save this'
                  )}
                </MotionButton>

                <MotionButton
                  variant="text"
                  startIcon={<RotateCcw size={16} />}
                  onClick={handleReset}
                  whileHover={{ scale: 1.03 }}
                  sx={{ color: 'accent.main' }}
                >
                  Analyze another
                </MotionButton>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
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
