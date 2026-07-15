/**
 * calculateNutrition.js
 *
 * Converts matched, quantified ingredients into a nutrition breakdown.
 *
 * The core challenge: USDA nutrition data (in ingredients.json) is per
 * 100g, but recipes specify quantities in cups, tbsp, tsp, whole eggs,
 * cloves, etc. Volume-to-gram conversion is ingredient-dependent — 1 cup
 * of flour (~120g) weighs much less than 1 cup of milk (~240g). This file
 * categorizes each ingredient by keyword and applies a category-appropriate
 * gram weight per unit, rather than a single fixed conversion for everything.
 *
 * This is a heuristic, not lab-grade precision — it's accurate enough for
 * an MVP nutrition estimate, not a certified nutrition label. Documented
 * as a known approximation in the SRS.
 */

// Grams per unit, by ingredient category. Values are commonly-cited
// kitchen-conversion averages (e.g. King Arthur Baking, USDA reference
// amounts). "generic" is the fallback when no category matches.
const CATEGORY_UNIT_WEIGHTS = {
  dry_powder: { cup: 120, tbsp: 7.5, tsp: 2.5 },   // flour, cocoa, cornstarch
  granulated_sugar: { cup: 200, tbsp: 12.5, tsp: 4.2 }, // sugar, brown sugar
  liquid: { cup: 240, tbsp: 15, tsp: 5 },          // milk, water, juice, broth
  oil: { cup: 218, tbsp: 13.6, tsp: 4.5 },         // cooking oils (lighter than water)
  fat_solid: { cup: 227, tbsp: 14.2, tsp: 4.7 },   // butter, margarine, shortening
  grain_dry: { cup: 185, tbsp: 11.6, tsp: 3.9 },   // uncooked rice, oats, quinoa
  shredded_cheese: { cup: 113, tbsp: 7, tsp: 2.3 },
  chopped_veg: { cup: 150, tbsp: 9.4, tsp: 3.1 },  // chopped onion, celery, etc.
  generic: { cup: 200, tbsp: 15, tsp: 5 },         // fallback when uncategorized
};

// Absolute (category-independent) unit conversions to grams.
const ABSOLUTE_UNIT_TO_GRAMS = {
  g: 1,
  kg: 1000,
  oz: 28.35,
  lb: 453.6,
  ml: 1,     // approximation: assumes density ~1g/ml, true for water/most liquids
  l: 1000,
};

// Average gram weight for common items counted individually ("3 eggs",
// "1 onion", "2 cloves garlic") rather than by volume/weight unit.
// Matched by keyword against the ingredient name. Fallback is 100g.
const WHOLE_ITEM_WEIGHTS = [
  { keywords: ['egg'], grams: 50 },
  { keywords: ['garlic'], grams: 3 },       // per clove
  { keywords: ['onion'], grams: 110 },
  { keywords: ['lemon'], grams: 58 },
  { keywords: ['lime'], grams: 44 },
  { keywords: ['apple'], grams: 182 },
  { keywords: ['banana'], grams: 118 },
  { keywords: ['tomato'], grams: 123 },
  { keywords: ['potato'], grams: 173 },
  { keywords: ['carrot'], grams: 61 },
  { keywords: ['bell pepper', 'pepper'], grams: 119 },
  { keywords: ['bread', 'slice'], grams: 28 },
  { keywords: ['can'], grams: 400 },        // standard can, e.g. tomatoes/beans
];

// Keyword -> category mapping, checked in order (first match wins).
// This runs against the *matched* USDA item's name, since that's more
// standardized than the free-text the user typed.
const CATEGORY_KEYWORDS = [
  { category: 'fat_solid', keywords: ['butter', 'margarine', 'shortening', 'lard'] },
  { category: 'oil', keywords: ['oil'] },
  { category: 'granulated_sugar', keywords: ['sugar'] },
  { category: 'dry_powder', keywords: ['flour', 'cocoa', 'cornstarch', 'baking powder', 'baking soda'] },
  { category: 'shredded_cheese', keywords: ['cheese'] },
  { category: 'grain_dry', keywords: ['rice', 'oats', 'quinoa', 'pasta', 'lentil'] },
  { category: 'liquid', keywords: ['milk', 'water', 'juice', 'broth', 'stock', 'cream', 'wine', 'vinegar'] },
  { category: 'chopped_veg', keywords: ['onion', 'celery', 'pepper', 'carrot'] },
];

/**
 * Determine which conversion category an ingredient belongs to, based on
 * its matched USDA name.
 */
function categorizeIngredient(matchedName) {
  const lower = matchedName.toLowerCase();
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return 'generic';
}

/**
 * Look up the average gram weight for a "whole item" ingredient (no
 * unit given — e.g. "3 eggs", "1 onion"). Falls back to 100g if no
 * keyword matches.
 */
function getWholeItemGrams(ingredientName) {
  const lower = ingredientName.toLowerCase();
  for (const { keywords, grams } of WHOLE_ITEM_WEIGHTS) {
    if (keywords.some(kw => lower.includes(kw))) {
      return grams;
    }
  }
  return 100; // generic fallback for an unrecognized whole item
}

/**
 * Convert a { quantity, unit, ingredientName } line (plus its matched
 * USDA item) into a gram amount.
 *
 * @param {number|null} quantity
 * @param {string|null} unit - canonical unit from parseRecipe.js (e.g. 'cup', 'tbsp', 'g'), or null
 * @param {string} matchedItemName - the name of the matched USDA ingredient
 * @param {string} originalIngredientName - the user's original text, used for whole-item lookup
 * @returns {number} grams
 */
export function convertToGrams(quantity, unit, matchedItemName, originalIngredientName) {
  // No quantity at all (e.g. "salt to taste") — treat as a small nominal
  // amount so it contributes negligibly rather than breaking the calc.
  if (quantity === null || quantity === undefined) {
    return 1; // 1g nominal; refine later if this proves too coarse
  }

  // No unit given — this is a "whole item" count (e.g. "3 eggs")
  if (!unit) {
    return quantity * getWholeItemGrams(originalIngredientName);
  }

  // Absolute units (weight/volume with a fixed, ingredient-independent conversion)
  if (ABSOLUTE_UNIT_TO_GRAMS[unit] !== undefined) {
    return quantity * ABSOLUTE_UNIT_TO_GRAMS[unit];
  }

  // Category-dependent volume units (cup, tbsp, tsp)
  if (['cup', 'tbsp', 'tsp'].includes(unit)) {
    const category = categorizeIngredient(matchedItemName);
    const weights = CATEGORY_UNIT_WEIGHTS[category] || CATEGORY_UNIT_WEIGHTS.generic;
    return quantity * (weights[unit] ?? CATEGORY_UNIT_WEIGHTS.generic[unit]);
  }

  // Unrecognized unit (e.g. 'pinch', 'clove', 'slice', 'piece') — treat as
  // whole-item count using the same lookup table.
  if (['pinch', 'clove', 'slice', 'can', 'piece'].includes(unit)) {
    return quantity * getWholeItemGrams(originalIngredientName);
  }

  // Fallback: unknown unit, assume grams 1:1 rather than silently dropping it
  return quantity;
}

// Nutrition fields present in ingredients.json, all per 100g.
const NUTRITION_FIELDS = ['calories', 'protein', 'carbs', 'fat', 'sat_fat', 'fiber', 'sugar', 'sodium'];

/**
 * Calculate the full nutrition breakdown for a recipe, given a list of
 * ingredient lines that have each already been matched to a confirmed
 * USDA ingredient (via the match-confirmation UI, not raw candidates).
 *
 * @param {Array<{
 *   quantity: number|null,
 *   unit: string|null,
 *   ingredientName: string,
 *   matchedItem: object   // the confirmed USDA ingredient object (from matchIngredient.js results)
 * }>} confirmedIngredients
 * @param {number} servings - number of servings the recipe makes (default 1, i.e. totals only)
 * @returns {{
 *   perIngredient: Array<{ ingredientName: string, matchedName: string, grams: number, ...nutritionFields }>,
 *   totals: { calories: number, protein: number, ... },
 *   perServing: { calories: number, protein: number, ... }
 * }}
 */
export function calculateNutrition(confirmedIngredients, servings = 1) {
  const perIngredient = [];
  const totals = Object.fromEntries(NUTRITION_FIELDS.map(f => [f, 0]));

  for (const entry of confirmedIngredients) {
    const { quantity, unit, ingredientName, matchedItem } = entry;

    if (!matchedItem) {
      // No confirmed match for this line — skip it from calculation but
      // don't crash. The UI should ideally prevent this state, but we
      // don't want one bad row to break the whole recipe's totals.
      perIngredient.push({
        ingredientName,
        matchedName: null,
        grams: 0,
        skipped: true,
        ...Object.fromEntries(NUTRITION_FIELDS.map(f => [f, 0])),
      });
      continue;
    }

    const grams = convertToGrams(quantity, unit, matchedItem.name, ingredientName);
    const scale = grams / 100; // USDA values are per 100g

    const rowNutrition = {};
    for (const field of NUTRITION_FIELDS) {
      const perHundred = matchedItem[field] ?? 0;
      const value = perHundred * scale;
      rowNutrition[field] = value;
      totals[field] += value;
    }

    perIngredient.push({
      ingredientName,
      matchedName: matchedItem.name,
      grams: Math.round(grams * 10) / 10,
      ...rowNutrition,
    });
  }

  // Round totals to 1 decimal place for display
  const roundedTotals = Object.fromEntries(
    NUTRITION_FIELDS.map(f => [f, Math.round(totals[f] * 10) / 10])
  );

  const perServing = Object.fromEntries(
    NUTRITION_FIELDS.map(f => [f, Math.round((totals[f] / servings) * 10) / 10])
  );

  return {
    perIngredient,
    totals: roundedTotals,
    perServing,
  };
}