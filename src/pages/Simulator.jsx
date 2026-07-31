// src/pages/Simulator.jsx
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { fadeUp } from '../motion/variants';
import { useAuth } from '../hooks/useAuth';
import { getRecipe } from '../logic/firestoreRecipes';
import { recalculateNutrition, diffNutrition } from '../logic/simulator';
import IngredientEditor from '../components/IngredientEditor';
import NutritionDifference from '../components/NutritionDifference';
import NutritionSummary from '../components/NutritionSummary';
import EmptyState from '../components/EmptyState';

export default function Simulator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const recipeId = searchParams.get('recipeId');

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    if (!user || !recipeId) {
      setLoading(false);
      return;
    }
    (async () => {
      const data = await getRecipe(user.uid, recipeId);
      setRecipe(data);
      setLoading(false);
    })();
  }, [user, recipeId]);

  const simulated = useMemo(() => {
    if (!recipe?.ingredients) return null;
    return recalculateNutrition(recipe.ingredients, quantities, recipe.servings || 1);
  }, [recipe, quantities]);

  const baseline = useMemo(() => {
    if (!recipe) return null;
    return { totals: recipe.totals, perServing: recipe.perServing };
  }, [recipe]);

  const delta = useMemo(() => {
    if (!baseline || !simulated) return {};
    return diffNutrition(baseline, simulated);
  }, [baseline, simulated]);

  if (loading) return null;

  if (!recipe) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <EmptyState
          title="Pick a recipe to start simulating"
          message="Choose a previously analyzed recipe from your history to try What-If changes."
          actionLabel="Go to History"
          onAction={() => navigate('/history')}
        />
      </Container>
    );
  }

  const handleChange = (fdc_id, value) => {
    setQuantities((prev) => ({ ...prev, [fdc_id]: value }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box component={motion.div} variants={fadeUp} initial="hidden" animate="visible" sx={{ mb: 4 }}>
        <Typography variant="h2" sx={{ fontSize: '1.75rem' }}>
          What-If Simulator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {recipe.recipeName || 'Untitled recipe'}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <IngredientEditor
            ingredients={recipe.ingredients}
            quantities={quantities}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <NutritionDifference delta={delta} />
        </Grid>
      </Grid>

      {simulated && (
        <Box sx={{ mt: 4 }}>
          <NutritionSummary nutrition={simulated} />
        </Box>
      )}
    </Container>
  );
}