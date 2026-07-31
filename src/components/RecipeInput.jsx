// src/pages/RecipeInput.jsx (or src/components/RecipeInput.jsx — keep at its current path)
import { useState, useMemo, useEffect } from 'react';
import {
  Box, Container, TextField, Button, CircularProgress, Typography,
  List, ListItem, ListItemText, Collapse, Paper, Grid,
  Card, CardContent, Accordion, AccordionSummary, AccordionDetails,
  Table, TableHead, TableRow, TableCell, TableBody, Snackbar, Alert,
} from '@mui/material';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import ConfidenceChip from './ConfidenceChip';
import MedicalRiskBadge from './MedicalRiskBadge';
import SubstitutionSuggestion from './SubstitutionSuggestion';
import ProfessionalConsultationAdvisory from './ProfessionalConsultationAdvisory';
import NutritionSummary from './NutritionSummary';
import { fadeUp, staggerContainer, scaleIn } from '../motion/variants';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { saveRecipe, getRecipe } from '../logic/firestoreRecipes';
import { getUserConditions } from '../logic/firestoreUser';
import { flagRisks } from '../logic/riskFlagging';
import { getSubstitutions } from '../logic/substitutionEngine';

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

const MotionButton = motion.create(Button);

// Extra per-100g fields calculateNutrition.js returns on `totals`/`perServing`,
// beyond the four headline macros shown in NutritionSummary's stat cards.
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
  const [matchedIngredients, setMatchedIngredients] = useState([]); // confirmedSelections shape, used by riskFlagging + save
  const [riskFlags, setRiskFlags] = useState([]); // Increment 3 — computed once nutrition is finalized

  // Substitutions are a pure derivation of riskFlags -- no separate state
  // or Firestore round-trip needed, recomputes automatically whenever
  // riskFlags changes (fresh analysis or hydrated from a saved recipe).
  const substitutions = useMemo(() => getSubstitutions(riskFlags), [riskFlags]);
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
        setMatchedIngredients(data.ingredients ?? []);
        setRiskFlags(data.riskFlags ?? []);
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

  const handleConfirmMatches = async () => {
    try {
      const confirmedSelections = ingredients.map((ing) => ({
        original: ing.original,
        matchedItem: ing.candidates.find((c) => c.fdc_id === ing.selectedMatchId) ?? null,
      }));
      const result = finalizeNutrition(confirmedSelections, servings, rawText);
      setNutrition(result);
      setMatchedIngredients(confirmedSelections);
      setStage('results');
      setSnackbar({ open: true, message: 'Matches confirmed', severity: 'success' });

      // Increment 3: flag risks against the user's saved conditions as soon
      // as results are available, so MedicalRiskBadge can show immediately
      // -- not only after the recipe is explicitly saved to History.
      if (user) {
        try {
          const conditions = await getUserConditions(user.uid);
          setRiskFlags(flagRisks(conditions, { perServing: result.perServing, ingredients: confirmedSelections }));
        } catch {
          setRiskFlags([]);
        }
      } else {
        setRiskFlags([]);
      }
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
        ingredients: matchedIngredients,
        totals: nutrition.totals,
        perServing: nutrition.perServing,
        servings,
        riskFlags, // already computed in handleConfirmMatches
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
    setMatchedIngredients([]);
    setNutrition(null);
    setRiskFlags([]);
    setSavedRecipeId(null);
    setStage('input');
  };

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
              <motion.div variants={scaleIn} initial="hidden" animate="visible">
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
                </Card>
              </motion.div>
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
              <ProfessionalConsultationAdvisory flags={riskFlags} />

              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Per serving ({servings} {servings === 1 ? 'serving' : 'servings'} total)
              </Typography>

              {/* 1. Nutrition summary — stat cards + macro chart, now shared with Simulator */}
              <Box sx={{ mb: 2 }}>
                <NutritionSummary nutrition={nutrition} />
              </Box>

              {/* 2. Medical risk badges (Increment 3) — renders nothing if flags is empty */}
              <MedicalRiskBadge flags={riskFlags} />

              {/* 3. Substitution suggestions (Increment 3) — full-width now that the
                   macro chart lives inside NutritionSummary above rather than sharing
                   a 2-column row with this */}
              <Box sx={{ mb: 2 }}>
                <SubstitutionSuggestion suggestions={substitutions} />
              </Box>

              {/* 4. Micronutrient table, collapsed by default */}
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

              {/* 5. Save to History + Reset */}
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
                    color: 'primary.contrastText',
                    borderRadius: '20px',
                    px: 3,
                    '&:hover': { bgcolor: 'secondary.main' },
                  }}
                >
                  {isSaving ? (
                    <CircularProgress size={18} sx={{ color: 'primary.contrastText' }} />
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