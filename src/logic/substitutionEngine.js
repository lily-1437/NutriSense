// src/logic/substitutionEngine.js
//
// Increment 3: Condition-Aware Smart Ingredient Substitution.
//
// Takes the risk flags already produced by riskFlagging.js's flagRisks()
// and returns concrete "swap this for that" suggestions. Deliberately
// downstream of risk flagging rather than a separate check -- if nothing
// was flagged, there's nothing to substitute.
//
// Two suggestion sources, mirroring the two rule types in riskFlagging.js:
//   1. INGREDIENT_SUBSTITUTIONS -- keyword -> concrete swap (e.g. "wheat
//      flour" -> "almond flour or rice flour" for Celiac). Used for
//      'ingredient'-type flags, where a specific food item was matched.
//   2. NUTRIENT_SUBSTITUTIONS -- nutrientKey -> a general technique rather
//      than a specific food (e.g. sodium -> "use fresh herbs/citrus instead
//      of salt"), since 'threshold'-type flags aren't about one ingredient,
//      they're about the recipe's overall nutrient load.

const INGREDIENT_SUBSTITUTIONS = {
  // Celiac / gluten
  wheat: 'almond flour or rice flour',
  flour: 'almond flour, rice flour, or a 1:1 gluten-free blend',
  bread: 'gluten-free bread or lettuce wraps',
  pasta: 'rice noodles or chickpea pasta',
  barley: 'quinoa or rice',
  rye: 'quinoa or rice',
  couscous: 'quinoa',

  // Lactose intolerance
  milk: 'almond milk, oat milk, or lactose-free milk',
  cheese: 'lactose-free cheese or nutritional yeast',
  cream: 'coconut cream or cashew cream',
  butter: 'olive oil or plant-based butter',
  yogurt: 'coconut yogurt or lactose-free yogurt',

  // Nut allergy
  peanut: 'sunflower seed butter',
  almond: 'sunflower seeds or pumpkin seeds',
  cashew: 'sunflower seeds or roasted chickpeas',
  walnut: 'toasted oats or sunflower seeds',

  // Shellfish allergy
  shrimp: 'chicken, tofu, or mushrooms',
  crab: 'jackfruit or hearts of palm',
  lobster: 'chicken or firm tofu',

  // Pregnancy
  'soft cheese': 'a pasteurized hard cheese',
  'deli meat': 'freshly cooked meat, heated until steaming',
  'raw fish': 'fully cooked fish or shrimp',
};

const NUTRIENT_SUBSTITUTIONS = {
  sodium: 'Use fresh herbs, citrus, or spices instead of added salt; choose a low-sodium broth/stock.',
  sugar: 'Cut added sugar by a third to half, or use a natural sweetener like mashed banana or stevia.',
  sat_fat: 'Swap butter or fatty cuts of meat for olive oil, avocado, or a leaner protein.',
  carbs: 'Reduce the portion of starchy ingredients, or swap for a lower-carb alternative like cauliflower rice.',
  protein: 'Consider a smaller portion size, or a lower-protein-density alternative.',
  calories: 'Reduce portion size, or swap a high-calorie ingredient for a lighter alternative.',
};

function findIngredientSubstitution(name) {
  const lower = (name ?? '').toLowerCase();
  for (const [keyword, swap] of Object.entries(INGREDIENT_SUBSTITUTIONS)) {
    if (lower.includes(keyword)) return swap;
  }
  return null;
}

/**
 * Returns an array of substitution suggestions derived from risk flags
 * (see riskFlagging.js's flagRisks() for the flag shape).
 *
 * @param {Array} riskFlags
 * @returns {Array<{ original: string, suggestion: string, reason: string, condition: string }>}
 */
export function getSubstitutions(riskFlags) {
  if (!riskFlags?.length) return [];

  const suggestions = [];
  const seen = new Set(); // dedupe identical original+suggestion pairs

  for (const flag of riskFlags) {
    if (flag.type === 'ingredient') {
      const swap = findIngredientSubstitution(flag.ingredientName);
      if (!swap) continue;
      const key = `${flag.ingredientName}::${swap}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({
        original: flag.ingredientName,
        suggestion: swap,
        reason: flag.message,
        condition: flag.condition,
      });
    } else if (flag.type === 'threshold') {
      const tip = NUTRIENT_SUBSTITUTIONS[flag.nutrientKey];
      if (!tip) continue;
      const key = `${flag.nutrientKey}::${flag.condition}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({
        original: `High ${flag.nutrientKey}`,
        suggestion: tip,
        reason: flag.message,
        condition: flag.condition,
      });
    }
  }

  return suggestions;
}
