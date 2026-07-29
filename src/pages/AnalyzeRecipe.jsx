// src/pages/AnalyzeRecipe.jsx
// Route: /analyze (public — see router.jsx). Also reused at /history/:recipeId
// to reopen Stage 3 results for a past recipe (Page Navigation Map §4, §10).
//
// This page is intentionally thin: RecipeInput owns all three-stage state
// (input -> confirm -> results) and logic-layer calls. Keeping this wrapper
// separate from the component matches the pages/ = routes, components/ =
// reusable pieces convention used elsewhere (Home.jsx, Dashboard.jsx, etc.).
//
// FIX: previously always rendered <RecipeInput /> with no props, so visiting
// /history/:recipeId showed a blank Stage 1 instead of the saved recipe's
// results. Now reads recipeId from the URL (undefined on plain /analyze)
// and passes it through so RecipeInput can hydrate from Firestore.

import { useParams } from 'react-router-dom';
import RecipeInput from '../components/RecipeInput';

export default function AnalyzeRecipe() {
  const { recipeId } = useParams(); // undefined on /analyze, set on /history/:recipeId
  return <RecipeInput recipeId={recipeId} />;
}
