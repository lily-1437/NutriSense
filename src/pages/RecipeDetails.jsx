// src/pages/RecipeDetails.jsx
// Route: /history/:recipeId (protected — see router.jsx).
// Dedicated read-only detail view for a single saved recipe, reached by
// clicking a card in History.jsx. Separate from AnalyzeRecipe/RecipeInput's
// Stage 3 -- that flow is for live analysis; this page is purely for
// reviewing something already saved (no "Save to History"/"Analyze another"
// actions, just the data + a way back + delete).

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Chip,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { useAuth } from '../hooks/useAuth';
import { getRecipe, deleteRecipe } from '../logic/firestoreRecipes';
import { fadeUp, staggerContainer, scaleIn } from '../motion/variants';
import MedicalRiskBadge from '../components/MedicalRiskBadge';
import SubstitutionSuggestion from '../components/SubstitutionSuggestion';
import { getSubstitutions } from '../logic/substitutionEngine';

const MotionCard = motion(Card);

const MICRO_LABELS = {
  sat_fat: 'Saturated Fat (g)',
  fiber: 'Fiber (g)',
  sugar: 'Sugar (g)',
  sodium: 'Sodium (mg)',
};

function formatDate(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function RecipeDetails() {
  const { recipeId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const MACRO_COLORS = {
    protein: theme.palette.primary.main,   // Verdigris
    fat: theme.palette.accent.main,        // Dandelion
    carbs: theme.palette.secondary.main,   // Shadow
  };

  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Hooks must run unconditionally on every render -- this has to sit above
  // the early returns below (loading spinner / "not found" state), even
  // though `recipe` is still null on those first renders. Optional chaining
  // keeps it safe: getSubstitutions([]) just returns [].
  const substitutions = useMemo(() => getSubstitutions(recipe?.riskFlags), [recipe]);

  useEffect(() => {
    if (authLoading || !user || !recipeId) return;
    let cancelled = false;
    setIsLoading(true);
    getRecipe(user.uid, recipeId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setSnackbar({ open: true, message: 'Recipe not found.', severity: 'error' });
        }
        setRecipe(data);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSnackbar({ open: true, message: 'Could not load this recipe.', severity: 'error' });
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, recipeId]);

  const handleDelete = async () => {
    if (!user || !recipeId) return;
    setConfirmDelete(false);
    try {
      await deleteRecipe(user.uid, recipeId);
      navigate('/history');
    } catch (err) {
      setSnackbar({ open: true, message: 'Could not delete recipe. Please try again.', severity: 'error' });
    }
  };

  if (authLoading || isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (!recipe) {
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', textAlign: 'center', py: 10 }}>
        <Typography sx={{ fontSize: 16, color: 'text.secondary', mb: 2 }}>
          This recipe couldn't be found.
        </Typography>
        <Button onClick={() => navigate('/history')} sx={{ color: 'primary.main' }}>
          Back to History
        </Button>
        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    );
  }

  const { recipeName, rawInput, servings, perServing, totals, ingredients, createdAt, riskFlags } = recipe;

  const macroChartData = [
    { name: 'Protein', value: perServing?.protein ?? 0, key: 'protein' },
    { name: 'Fat', value: perServing?.fat ?? 0, key: 'fat' },
    { name: 'Carbs', value: perServing?.carbs ?? 0, key: 'carbs' },
  ];

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, md: 0 }, py: 4 }}>
      {/* Back + delete row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Button
          startIcon={<ArrowLeft size={17} />}
          onClick={() => navigate('/history')}
          sx={{ color: 'text.secondary', textTransform: 'none', fontSize: 13.5 }}
        >
          Back to History
        </Button>
        <IconButton onClick={() => setConfirmDelete(true)} sx={{ color: 'secondary.main' }}>
          <Trash2 size={18} />
        </IconButton>
      </Box>

      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: 22, md: 26 },
            color: 'text.primary',
          }}
        >
          {recipeName || 'Untitled recipe'}
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5, mb: 1 }}>
          Saved {formatDate(createdAt)} · {servings} {servings === 1 ? 'serving' : 'servings'}
        </Typography>
      </motion.div>

      <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 3 }}>
        Per serving
      </Typography>

      {/* Nutrition summary */}
      <motion.div initial="hidden" animate="visible" variants={staggerContainer(0.08)}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {['calories', 'protein', 'fat', 'carbs'].map((key) => (
            <Grid item xs={6} sm={3} key={key}>
              <motion.div variants={fadeUp}>
                <Card sx={{ borderRadius: '16px', textAlign: 'center', p: 1 }} elevation={0}>
                  <CardContent>
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: 26,
                        color: 'primary.dark',
                      }}
                    >
                      {Math.round(perServing?.[key] ?? 0)}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'capitalize' }}>
                      {key === 'calories' ? 'Calories' : `${key} (g)`}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Medical risk badges (Increment 3) — renders nothing if riskFlags is empty */}
      <MedicalRiskBadge flags={riskFlags} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Macro chart */}
        <Grid item xs={12} md={6}>
          <MotionCard variants={scaleIn} initial="hidden" animate="visible" sx={{ borderRadius: '16px', p: 1 }} elevation={0}>
            <CardContent>
              <Typography sx={{ fontSize: 14.5, fontWeight: 600, mb: 1, color: 'text.primary' }}>
                Macronutrient Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={macroChartData} dataKey="value" nameKey="name" outerRadius={80} isAnimationActive animationDuration={400}>
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

        {/* Original recipe text */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '16px', p: 1, height: '100%' }} elevation={0}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 600, mb: 1, color: 'text.primary' }}>
                Original Recipe
              </Typography>
              <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  maxHeight: 220,
                  fontSize: 13,
                  color: 'text.secondary',
                  whiteSpace: 'pre-wrap',
                  bgcolor: 'background.default',
                  borderRadius: '10px',
                  p: 1.5,
                }}
              >
                {rawInput || 'No original text saved.'}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Substitution suggestions (Increment 3) */}
      <Box sx={{ mb: 2 }}>
        <SubstitutionSuggestion suggestions={substitutions} />
      </Box>

      {/* Ingredients used */}
      {Array.isArray(ingredients) && ingredients.length > 0 && (
        <Card sx={{ borderRadius: '16px', mb: 2 }} elevation={0}>
          <CardContent>
            <Typography sx={{ fontSize: 14.5, fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
              Matched Ingredients
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {ingredients.map((ing, i) => (
                <Chip
                  key={i}
                  label={ing.original?.raw || ing.matchedItem?.name || `Ingredient ${i + 1}`}
                  size="small"
                  sx={{ bgcolor: 'background.default', color: 'text.primary' }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Micronutrient table */}
      <Accordion sx={{ borderRadius: '16px' }} elevation={0}>
        <AccordionSummary expandIcon={<ChevronDown size={20} />}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 600 }}>Micronutrient Detail</Typography>
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
                  <TableCell align="right">{perServing?.[key] ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle sx={{ fontFamily: (t) => t.typography.h3.fontFamily }}>
          Delete this recipe?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            "{recipeName || 'Untitled recipe'}" will be permanently removed from your history. This
            can't be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
