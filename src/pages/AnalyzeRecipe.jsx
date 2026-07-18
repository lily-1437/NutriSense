// src/pages/AnalyzeRecipe.jsx
// Route: /analyze (public — see router.jsx). Also reused at /history/:recipeId
// to reopen Stage 3 results for a past recipe (Page Navigation Map §4, §10).
//
// This page is intentionally thin: RecipeInput owns all three-stage state
// (input -> confirm -> results) and logic-layer calls. Keeping this wrapper
// separate from the component matches the pages/ = routes, components/ =
// reusable pieces convention used elsewhere (Home.jsx, Dashboard.jsx, etc.).

import RecipeInput from '../components/RecipeInput';

export default function AnalyzeRecipe() {
  return <RecipeInput />;
}
