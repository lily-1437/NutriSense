// src/pages/AnalyzeRecipe.jsx

import { useParams } from 'react-router-dom';
import RecipeInput from '../components/RecipeInput';

export default function AnalyzeRecipe() {
  const { recipeId } = useParams(); // undefined on /analyze, set on /history/:recipeId
  return <RecipeInput recipeId={recipeId} />;
}
