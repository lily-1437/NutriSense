/**
 * analyzeRecipe.js
 *
 * Orchestrator that chains the three core logic modules together:
 *   parseRecipe.js -> matchIngredient.js -> calculateNutrition.js
 *
 * OVERRIDE PATH (new): before running the fuzzy USDA pipeline, checks
 * whether the pasted recipe matches a curated entry in
 * src/data/recipeOverrides.json (recipes with pre-verified nutrition
 * data, added because fuzzy matching against USDA SR Legacy sometimes
 * gives wrong/low-confidence matches). Override recipes are NOT run
 * through calculateNutrition.js — their nutrition values are already
 * resolved for the recipe's actual quantities (not per-100g), so passing
 * them through calculateNutrition's per-100g scaling logic would double
 * apply a conversion that was never meant to happen. Override recipes
 * short-circuit straight to their own pre-computed totals/perServing.
 */

import { parseRecipe } from './parseRecipe';
import { matchIngredients } from './matchIngredient';
import { calculateNutrition } from './calculateNutrition';
import { findRecipeOverride } from './recipeOverrideMatcher';

const NUTRITION_FIELDS = ['calories', 'protein', 'carbs', 'fat', 'sat_fat', 'fiber', 'sugar', 'sodium'];

/**
 * Stage 1: parse the raw recipe text and find candidate matches for each
 * ingredient. Returns data shaped for a confirmation UI to render.
 *
 * If the recipe matches a curated override, returns a single high-
 * confidence "candidate" per ingredient built from the override data,
 * instead of running parseRecipe/matchIngredients.
 */
export function prepareRecipeAnalysis(rawText) {
  const override = findRecipeOverride(rawText);

  if (override) {
    return override.ingredients.map((entry, idx) => ({
      original: {
        raw: entry.raw,
        quantity: entry.quantity,
        unit: entry.unit,
        ingredientName: entry.raw,
        prepNote: null,
      },
      candidates: [
        {
          fdc_id: `override_${override.displayName.toLowerCase().replace(/\s+/g, '_')}_${idx}`,
          name: entry.raw,
          confidence: 'high',
          matchScore: 1,
          isOverride: true, // marker, harmless if unused by the UI
        },
      ],
    }));
  }

  const parsedIngredients = parseRecipe(rawText);
  return matchIngredients(parsedIngredients);
}

/**
 * Stage 2: once the user has confirmed a specific match for each
 * ingredient line, calculate the full nutrition breakdown.
 *
 * @param {Array<{ original: object, matchedItem: object }>} confirmedSelections
 * @param {number} servings - ignored for override recipes; the override's
 *   own servings count is used instead, since its perServing values were
 *   computed against that specific serving count.
 * @param {string} [rawText] - the original pasted text, needed to re-check
 *   whether this recipe is an override at finalize time.
 */
export function finalizeNutrition(confirmedSelections, servings = 1, rawText = '') {
  const override = rawText ? findRecipeOverride(rawText) : null;

  if (override) {
    const perIngredient = override.ingredients.map((entry) => ({
      ingredientName: entry.raw,
      matchedName: entry.raw,
      grams: null, // not applicable — override nutrition isn't gram-scaled
      ...entry.nutrition,
    }));

    return {
      perIngredient,
      totals: override.totals,
      perServing: override.perServing,
      overrideServings: override.servings, // so the UI can show/correct the servings count if it differs from what the user typed
    };
  }

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
 */
export function analyzeRecipeAuto(rawText, servings = 1) {
  const withCandidates = prepareRecipeAnalysis(rawText);

  const autoConfirmed = withCandidates.map(entry => ({
    original: entry.original,
    matchedItem: entry.candidates[0] || null,
  }));

  return finalizeNutrition(autoConfirmed, servings, rawText);
}