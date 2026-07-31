// src/logic/simulator.js
// Re-runs finalizeNutrition (the same function Stage 2->3 uses) against
// edited quantities, instead of reimplementing nutrition math separately.
// matchedIngredients here is the SAME shape stored on the recipe doc:
// [{ original: {quantity, unit, ingredientName, prepNote, raw}, matchedItem: {fdc_id, name, ...} }]

import { finalizeNutrition } from './analyzeRecipe';

/**
 * @param {Array} matchedIngredients - recipe.ingredients as stored in Firestore
 * @param {Object} quantityOverrides - { [fdc_id]: newQuantity }
 * @param {number} servings
 */
export function recalculateNutrition(matchedIngredients, quantityOverrides = {}, servings = 1) {
  const adjusted = matchedIngredients.map((entry) => {
    if (!entry.matchedItem) return entry;
    const key = entry.matchedItem.fdc_id;
    if (!(key in quantityOverrides)) return entry;
    return {
      ...entry,
      original: { ...entry.original, quantity: quantityOverrides[key] },
    };
  });

  return finalizeNutrition(adjusted, servings);
}

export function diffNutrition(baseline, simulated) {
  const keys = new Set([
    ...Object.keys(baseline?.perServing || {}),
    ...Object.keys(simulated?.perServing || {}),
  ]);

  const delta = {};
  for (const key of keys) {
    const before = baseline?.perServing?.[key] ?? 0;
    const after = simulated?.perServing?.[key] ?? 0;
    delta[key] = Math.round((after - before) * 10) / 10;
  }
  return delta;
}