/**
 * analyzeRecipe.js
 *
 * Orchestrator that chains the core logic modules together:
 *   parseRecipe.js -> matchIngredient.js -> calculateNutrition.js
 *                                         -> riskFlagging.js -> substitutionEngine.js
 *
 * OVERRIDE PATH: before running the fuzzy USDA pipeline, checks whether
 * the pasted recipe matches a curated entry in
 * src/data/recipeOverrides.json (recipes with pre-verified nutrition
 * data, added because fuzzy matching against USDA SR Legacy sometimes
 * gives wrong/low-confidence matches).
 *
 * Each override ingredient carries its own pre-verified `nutrition`
 * PLUS a `matchCandidates` array — alternate fuzzy-match options with
 * their own nutrition, mirroring what matchIngredient.js's normal
 * pipeline would have produced. Previously these were computed but never
 * surfaced: prepareRecipeAnalysis returned only the single override
 * entry, so the confirm-matches UI had nothing to choose between for an
 * override recipe. Now the override's own entry is returned as the
 * top ("high" confidence) candidate, with matchCandidates appended as
 * selectable alternates — exactly the same shape/UI as the normal
 * fuzzy-match flow (ConfidenceChip renders whatever candidates array it's
 * given, override or not).
 *
 * Because a user can now pick an ALTERNATE candidate for an override
 * ingredient, finalizeNutrition no longer just returns the override's
 * fixed totals/perServing wholesale — it sums whichever candidate's
 * nutrition was actually confirmed per ingredient (falling back to the
 * override's own default if nothing was confirmed for that line), so the
 * totals genuinely reflect what the user picked. Every candidate's
 * nutrition values (both the override's own and matchCandidates') are
 * already resolved for the recipe's actual quantities (not per-100g), so
 * summing them directly is correct — no calculateNutrition-style scaling
 * needed for either branch.
 *
 * CONDITION-AWARE STAGES: finalizeNutrition optionally accepts the user's
 * saved health conditions (from firestoreUser.js's getUserConditions) and,
 * if given, runs two more stages after nutrition is calculated:
 *   Stage 3: riskFlagging.js's flagRisks() — condition-specific warnings.
 *   Stage 4: substitutionEngine.js's getSubstitutions() — concrete swap
 *            suggestions derived FROM those risk flags.
 * If `conditions` is omitted or empty, both stages correctly return [].
 */

import { parseRecipe } from './parseRecipe';
import { matchIngredients } from './matchIngredient';
import { calculateNutrition } from './calculateNutrition';
import { findRecipeOverride } from './recipeOverrideMatcher';
import { flagRisks } from './riskFlagging';
import { getSubstitutions } from './substitutionEngine';

const NUTRITION_FIELDS = ['calories', 'protein', 'carbs', 'fat', 'sat_fat', 'fiber', 'sugar', 'sodium'];

// Similarity -> confidence label, mirroring what matchIngredient.js's
// normal pipeline is assumed to use for its own candidates. Adjust these
// cutoffs to match matchIngredient.js's actual thresholds if they differ —
// this file doesn't import that logic since override matchCandidates
// don't go through matchIngredient.js at all.
function confidenceFromSimilarity(similarity) {
  if (similarity >= 0.75) return 'high';
  if (similarity >= 0.6) return 'medium';
  return 'low';
}

/**
 * Stage 1: parse the raw recipe text and find candidate matches for each
 * ingredient. Returns data shaped for a confirmation UI to render.
 *
 * If the recipe matches a curated override, returns the override's own
 * pre-verified entry as the top candidate PLUS its matchCandidates as
 * selectable alternates, instead of running parseRecipe/matchIngredients.
 */
export function prepareRecipeAnalysis(rawText) {
  const override = findRecipeOverride(rawText);

  if (override) {
    return override.ingredients.map((entry, idx) => {
      const primaryCandidate = {
        fdc_id: `override_${override.displayName.toLowerCase().replace(/\s+/g, '_')}_${idx}`,
        name: entry.raw,
        confidence: 'high',
        matchScore: 1,
        isOverride: true, // marker, harmless if unused by the UI
        ...entry.nutrition, // embed nutrition fields directly on the candidate, matching matchIngredient.js's candidate shape
      };

      const alternateCandidates = (entry.matchCandidates ?? []).map((alt, altIdx) => ({
        fdc_id: `override_${override.displayName.toLowerCase().replace(/\s+/g, '_')}_${idx}_alt${altIdx}`,
        name: alt.name,
        confidence: confidenceFromSimilarity(alt.similarity),
        matchScore: alt.similarity,
        isOverride: false,
        ...alt.nutrition,
      }));

      return {
        original: {
          raw: entry.raw,
          quantity: entry.quantity,
          unit: entry.unit,
          ingredientName: entry.raw,
          prepNote: null,
        },
        candidates: [primaryCandidate, ...alternateCandidates],
      };
    });
  }

  const parsedIngredients = parseRecipe(rawText);
  return matchIngredients(parsedIngredients);
}

/**
 * Stage 2: once the user has confirmed a specific match for each
 * ingredient line, calculate the full nutrition breakdown. If `conditions`
 * is passed, also runs Stage 3 (risk flagging) and Stage 4 (substitution
 * suggestions) against the result.
 *
 * @param {Array<{ original: object, matchedItem: object }>} confirmedSelections
 * @param {number} servings - ignored for override recipes; the override's
 *   own servings count is used instead, since its nutrition values were
 *   computed against that specific serving count.
 * @param {string} [rawText] - the original pasted text, needed to re-check
 *   whether this recipe is an override at finalize time.
 * @param {string[]} [conditions] - the user's saved health conditions.
 *
 * @returns {{
 *   perIngredient: array, totals: object, perServing: object,
 *   overrideServings?: number,
 *   riskFlags: array, substitutions: array,
 * }}
 */
export function finalizeNutrition(confirmedSelections, servings = 1, rawText = '', conditions = []) {
  const override = rawText ? findRecipeOverride(rawText) : null;

  let result;

  if (override) {
    // Sum whichever candidate the user actually confirmed per ingredient
    // (their own override default, or one of the alternates), falling back
    // to the override's own entry if a line was somehow left unconfirmed
    // (shouldn't happen — Confirm Matches is disabled until every line has
    // a selection — but this keeps totals correct rather than throwing).
    const perIngredient = override.ingredients.map((entry, idx) => {
      const confirmed = confirmedSelections[idx]?.matchedItem;
      const source = confirmed ?? { name: entry.raw, ...entry.nutrition };
      const nutrition = {};
      for (const field of NUTRITION_FIELDS) {
        nutrition[field] = source[field] ?? entry.nutrition[field] ?? 0;
      }
      return {
        ingredientName: entry.raw,
        matchedName: source.name ?? entry.raw,
        grams: null, // not applicable — override nutrition isn't gram-scaled
        ...nutrition,
      };
    });

    const totals = {};
    for (const field of NUTRITION_FIELDS) {
      totals[field] = perIngredient.reduce((sum, ing) => sum + (ing[field] ?? 0), 0);
    }
    const perServing = {};
    for (const field of NUTRITION_FIELDS) {
      perServing[field] = Math.round((totals[field] / override.servings) * 10) / 10;
    }

    result = {
      perIngredient,
      totals,
      perServing,
      overrideServings: override.servings, // so the UI can show/correct the servings count if it differs from what the user typed
    };
  } else {
    const forCalculation = confirmedSelections.map(sel => ({
      quantity: sel.original.quantity,
      unit: sel.original.unit,
      ingredientName: sel.original.ingredientName,
      matchedItem: sel.matchedItem,
    }));

    result = calculateNutrition(forCalculation, servings);
  }

  // Stage 3 + 4 — riskFlagging.js's checkKeywordRules reads
  // ingredient.matchedItem?.name || ingredient.original?.raw, so we pass
  // confirmedSelections (which has that exact shape) rather than
  // result.perIngredient (which doesn't, and differs between the override
  // and calculateNutrition branches above).
  const riskFlags = flagRisks(conditions, {
    perServing: result.perServing,
    ingredients: confirmedSelections,
  });
  const substitutions = getSubstitutions(riskFlags);

  return { ...result, riskFlags, substitutions };
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
