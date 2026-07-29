// src/pages/History.jsx
// Route: /history (protected — see router.jsx).
// Lists all recipes the current user has saved via Stage 3's "Save to
// History" button (RecipeInput.jsx -> saveRecipe()). Each entry links to
// /history/:recipeId, which reopens AnalyzeRecipe/RecipeInput at Stage 3
// with that recipe's saved totals/perServing hydrated (see the hydration
// useEffect added to RecipeInput.jsx).

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ChevronRight, UtensilsCrossed } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { getAllRecipes, deleteRecipe } from '../logic/firestoreRecipes';
import { fadeUp, staggerContainer } from '../motion/variants';
import EmptyState from '../components/EmptyState';

const MotionCard = motion(Card);

function formatDate(timestamp) {
  // Firestore Timestamp -> JS Date. Guard for the brief window right after
  // saving where serverTimestamp() hasn't resolved locally yet.
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [pendingDelete, setPendingDelete] = useState(null); // recipe object awaiting confirm

  const loadRecipes = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getAllRecipes(user.uid);
      setRecipes(data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Could not load your history.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadRecipes();
    }
  }, [authLoading, user, loadRecipes]);

  const handleView = (recipeId) => {
    navigate(`/history/${recipeId}`);
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete || !user) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteRecipe(user.uid, id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      setSnackbar({ open: true, message: 'Recipe deleted.', severity: 'success' });
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

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, md: 0 }, py: 4 }}>
      <Typography
        variant="h3"
        sx={{
          fontSize: 24,
          color: 'text.primary',
          mb: 3,
        }}
      >
        History
      </Typography>

      {recipes.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No saved recipes"
          message="Recipes you save from the Analyze Recipe results page will show up here."
          actionLabel="Analyze one to begin"
          onAction={() => navigate('/analyze')}
        />
      ) : (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer(0.06)}>
          <Grid container spacing={2}>
            {recipes.map((recipe) => (
              <Grid item xs={12} key={recipe.id}>
                <motion.div variants={fadeUp}>
                  <MotionCard
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    sx={{
                      borderRadius: '18px',
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                    }}
                    elevation={0}
                    onClick={() => handleView(recipe.id)}
                  >
                    <CardContent
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        '&:last-child': { pb: 2 },
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          flexShrink: 0,
                          borderRadius: '12px',
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <UtensilsCrossed size={20} color={theme.palette.primary.contrastText} />
                      </Box>

                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}
                          noWrap
                        >
                          {recipe.recipeName || 'Untitled recipe'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {formatDate(recipe.createdAt)}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>·</Typography>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}
                          </Typography>
                        </Box>
                      </Box>

                      <Chip
                        label={`${Math.round(recipe.perServing?.calories ?? 0)} kcal`}
                        size="small"
                        sx={{
                          bgcolor: 'background.default',
                          color: 'primary.dark',
                          fontWeight: 600,
                          display: { xs: 'none', sm: 'flex' },
                        }}
                      />

                      <IconButton
                        aria-label="Delete recipe"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(recipe);
                        }}
                        sx={{ color: 'secondary.main' }}
                      >
                        <Trash2 size={17} />
                      </IconButton>

                      <ChevronRight size={18} color={theme.palette.text.secondary} />
                    </CardContent>
                  </MotionCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}

      {/* Delete confirmation */}
      <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}>
        <DialogTitle sx={{ fontFamily: (t) => t.typography.h3.fontFamily }}>
          Delete this recipe?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
            "{pendingDelete?.recipeName || 'Untitled recipe'}" will be permanently removed from your
            history. This can't be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingDelete(null)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirmed}
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
