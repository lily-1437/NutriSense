/**
 * analyzeRecipe.js
 *
 * Orchestrator that chains the three core logic modules together:
 *   parseRecipe.js -> matchIngredient.js -> calculateNutrition.js
 *
 * IMPORTANT: nutrition calculation depends on the user CONFIRMING which
 * candidate match is correct for each ambiguous ingredient (per the WBS
 * 1.2.5 match-confirmation UI — showing 2-3 candidates, not silently
 * auto-picking). Because of that, this file exposes two stages rather
 * than one fully automatic function:
 *
 *   1. prepareRecipeAnalysis(rawText)
 *        parse + match -> returns candidates for the confirmation UI
 *   2. finalizeNutrition(confirmedSelections, servings)
 *        takes the user's confirmed choices -> returns nutrition totals
 *
 * A convenience function, analyzeRecipeAuto(), is also included for quick
 * testing/demos — it auto-picks each ingredient's top match instead of
 * waiting for user confirmation. It should NOT be used in the real
 * RecipeInput.jsx flow, since it skips the confirmation step your WBS
 * requires; it exists purely so you can sanity-check the full pipeline
 * end-to-end from the console before the confirmation UI is built.
 */

import { parseRecipe } from './parseRecipe';
import { matchIngredients } from './matchIngredient';
import { calculateNutrition } from './calculateNutrition';

/**
 * Stage 1: parse the raw recipe text and find candidate matches for each
 * ingredient. Returns data shaped for a confirmation UI to render.
 *
 * @param {string} rawText
 * @returns {Array<{
 *   original: { quantity, unit, ingredientName, prepNote, raw },
 *   candidates: Array<matchedItem>  // 2-3 candidates, best first
 * }>}
 */
export function prepareRecipeAnalysis(rawText) {
  const parsedIngredients = parseRecipe(rawText);
  return matchIngredients(parsedIngredients);
}

/**
 * Stage 2: once the user has confirmed a specific match for each
 * ingredient line, calculate the full nutrition breakdown.
 *
 * @param {Array<{ original: object, matchedItem: object }>} confirmedSelections
 *   - one entry per ingredient line, with the user's chosen candidate
 *     attached as `matchedItem`
 * @param {number} servings
 * @returns {object} nutrition breakdown, see calculateNutrition.js
 */
export function finalizeNutrition(confirmedSelections, servings = 1) {
  const forCalculation = confirmedSelections.map(sel => ({
    quantity: sel.original.quantity,
    unit: sel.original.unit,
    ingredientName: sel.original.ingredientName,
    matchedItem: sel.matchedItem,
  }));

  return calculateNutrition(forCalculation, servings);
}

/**
 * DEV/TESTING ONLY — full pipeline with auto-selected top matches.
 * Skips the confirmation step. Do not wire this into RecipeInput.jsx;
 * use prepareRecipeAnalysis() + finalizeNutrition() there instead so the
 * user gets to confirm ambiguous matches per the WBS UX requirement.
 *
 * @param {string} rawText
 * @param {number} servings
 */
export function analyzeRecipeAuto(rawText, servings = 1) {
  const withCandidates = prepareRecipeAnalysis(rawText);

  const autoConfirmed = withCandidates.map(entry => ({
    original: entry.original,
    matchedItem: entry.candidates[0] || null, // top-ranked candidate, or null if no match found
  }));

  return finalizeNutrition(autoConfirmed, servings);
}