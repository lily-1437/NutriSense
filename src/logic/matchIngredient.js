import Fuse from 'fuse.js';
import usdaIngredients from '../data/ingredients.json';
import customIngredients from '../data/customIngredients.json';

// Merge USDA SR Legacy data with a small curated addendum covering common
// South/East Asian ingredients missing from USDA's dataset (garam masala,
// oyster sauce, fish sauce, gochujang, etc.). See customIngredients.json
// for sourcing notes on each entry — some are directly from USDA
// FoodData Central (just not in this SR Legacy snapshot), others are
// reasonable approximations where no single-ingredient USDA equivalent
// exists. This addendum is the direct answer to "USDA doesn't have X":
// rather than overriding to a wrong existing entry, add the right one.
const ingredients = [...usdaIngredients, ...customIngredients];

/**
 * Fuse.js instance, built once and reused across calls.
 * threshold: 0.0 = exact match only, 1.0 = match anything. 0.35 is a
 * reasonable starting point for ingredient names — tune after testing
 * against real recipe text.
 */
const fuse = new Fuse(ingredients, {
  keys: ['name'],
  threshold: 0.55,        // widened further so more generic candidates enter the pool before re-ranking
  ignoreLocation: true,   // don't penalize matches that aren't near the start of the string
  minMatchCharLength: 2,
  includeScore: true,
});

// A handful of very common staples that appear in nearly every recipe.
// USDA names these in reversed/clinical order (e.g. "Oil, olive, salad or
// cooking" instead of "olive oil"), which confuses plain fuzzy string
// distance and lets branded/compound products outrank the plain form.
// This override map short-circuits straight to the right item for exact
// or near-exact query matches, before Fuse even runs.
const STAPLE_OVERRIDES = {
  'olive oil': 'Oil, olive, salad or cooking',
  'flour': 'Wheat flour, white, all-purpose, enriched, bleached',
  'all purpose flour': 'Wheat flour, white, all-purpose, enriched, bleached',
  'chicken breast': 'Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw',
  'butter': 'Butter, salted',
  'egg': 'Egg, whole, raw, fresh',
  'eggs': 'Egg, whole, raw, fresh',
  'milk': 'Milk, whole, 3.25% milkfat, with added vitamin D',
  'salt': 'Salt, table',
  'sugar': 'Sugars, granulated',
  'vegetable oil': 'Oil, soybean, salad or cooking',
  'garlic': 'Garlic, raw',
  'onion': 'Onions, raw',
  'bread': 'Bread, wheat',
  'lettuce': 'Lettuce, iceberg (includes crisphead types), raw',
  'lettuce leaves': 'Lettuce, iceberg (includes crisphead types), raw',
  'tomato': 'Tomatoes, red, ripe, raw, year round average',
  'tomato slices': 'Tomatoes, red, ripe, raw, year round average',
  'cucumber': 'Cucumber, with peel, raw',
  'cucumber slices': 'Cucumber, with peel, raw',
  'mustard': 'Mustard, prepared, yellow',
  'black pepper': 'Spices, pepper, black',
  'pepper': 'Spices, pepper, black',
  'cheese': 'Cheese, cheddar, sharp, sliced',
  'mayonnaise': 'Salad dressing, mayonnaise, regular',
  'spaghetti': 'Pasta, dry, enriched',
  'pasta': 'Pasta, dry, enriched',
  'ground beef': 'Beef, ground, 70% lean meat / 30% fat, raw',
  'canned crushed tomatoes': 'Tomatoes, crushed, canned',
  'crushed tomatoes': 'Tomatoes, crushed, canned',
  'canned tomatoes': 'Tomatoes, crushed, canned',
  'tomato paste': "Tomato products, canned, paste, without salt added (Includes foods for USDA's Food Distribution Program)",
  'dried basil': 'Spices, basil, dried',
  'basil': 'Spices, basil, dried',
  'dried oregano': 'Spices, oregano, dried',
  'oregano': 'Spices, oregano, dried',
  'grated parmesan cheese': 'Cheese, parmesan, grated',
  'parmesan cheese': 'Cheese, parmesan, grated',
  'parmesan': 'Cheese, parmesan, grated',
  'cooking oil': 'Oil, soybean, salad or cooking',
  'coriander powder': 'Spices, coriander seed',
  'coriander seeds': 'Spices, coriander seed',
  'fresh coriander': 'Spices, coriander seed',
  'ginger paste': 'Spices, ginger, ground',
  'ginger': 'Ginger root, raw',
  'ginger-garlic paste': 'Ginger root, raw',
  'mustard oil': 'Oil, mustard',
  'ghee': 'Butter, Clarified butter (ghee)',
  'ghee or oil': 'Butter, Clarified butter (ghee)',
  'soy sauce': 'Soy sauce made from soy (tamari)',
  'sesame oil': 'Oil, sesame, salad or cooking',
  'cardamom': 'Spices, cardamom',
  'cardamoms': 'Spices, cardamom',
  'cardamom pods': 'Spices, cardamom',
  'green cardamoms': 'Spices, cardamom',
  'cardamom powder': 'Spices, cardamom',
  'cinnamon stick': 'Spices, cinnamon, ground',
  'cinnamon': 'Spices, cinnamon, ground',
  'bay leaves': 'Spices, bay leaf',
  'bay leaf': 'Spices, bay leaf',
  'cumin seeds': 'Spices, cumin seed',
  'cumin powder': 'Spices, cumin seed',
  'cumin': 'Spices, cumin seed',
  'chicken thighs': 'Chicken, broilers or fryers, thigh, meat and skin, raw',
  'whole chicken': 'Chicken, broilers or fryers, meat and skin, raw',
  'boneless chicken': 'Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw',
  'chicken pieces': 'Chicken, broilers or fryers, meat and skin, raw',
  'ground chicken': 'Chicken, broilers or fryers, meat only, raw',
  'minced chicken': 'Chicken, broilers or fryers, meat only, raw',
  'chicken breast fillets': 'Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw',
  'cooked rice': 'Rice, white, long-grain, regular, enriched, cooked',
  'steamed rice': 'Rice, white, long-grain, regular, enriched, cooked',
  'basmati rice': 'Rice, white, long-grain, regular, enriched, cooked',
  'rice': 'Rice, white, long-grain, regular, enriched, cooked',
  'peas': 'Peas, green, raw',
  'green peas': 'Peas, green, raw',
  'cauliflower': 'Cauliflower, raw',
  'cauliflower florets': 'Cauliflower, raw',
  'cocoa powder': 'Cocoa, dry powder, unsweetened',
  'vanilla extract': 'Vanilla extract',
  'baking soda': 'Leavening agents, baking soda',
  'baking powder': 'Leavening agents, baking powder, double-acting, sodium aluminum sulfate',
  'dark chocolate': 'Chocolate, dark, 60-69% cacao solids',
  'chopped almonds': 'Nuts, almonds, dry roasted, with salt added',
  'almonds': 'Nuts, almonds, dry roasted, with salt added',
  'chopped pistachios': 'Nuts, pistachio nuts, raw',
  'pistachios': 'Nuts, pistachio nuts, raw',
  'chopped cashews': 'Nuts, cashew nuts, raw',
  'cashews': 'Nuts, cashew nuts, raw',
  'mozzarella cheese': 'Cheese, mozzarella, whole milk',
  'cream cheese': 'Cheese spread, cream cheese base',
  'condensed milk': 'Milk, canned, condensed, sweetened',
  'whole milk': 'Milk, whole, 3.25% milkfat, with added vitamin D',
  'heavy cream': 'Cream, fluid, heavy whipping',
  'brown sugar': 'Sugars, brown',
  'white sugar': 'Sugars, granulated',
  'all-purpose flour': 'Wheat flour, white, all-purpose, enriched, bleached',
  'macaroni': 'Pasta, dry, enriched',
  'fettuccine': 'Pasta, dry, enriched',
  'fettuccine or penne': 'Pasta, dry, enriched',
  'potatoes': 'Potatoes, raw, skin',
  'potato': 'Potatoes, raw, skin',
  'garam masala': 'Garam masala (custom entry, approximated from USDA curry powder)',
  'oyster sauce': 'Oyster sauce (custom entry, sourced from USDA FoodData Central)',
  'fish sauce': 'Fish sauce (custom entry, sourced from USDA FoodData Central)',
  'gochujang': 'Gochujang (custom entry, approximated from public nutrition sources)',
  'teriyaki sauce': 'Sauce, teriyaki, ready-to-serve',
};

// A bounded list of known brand/restaurant/chain names found in USDA data.
// Unlike the STAPLE_OVERRIDES map above (which grows every time a new
// recipe surfaces a new plain ingredient), this list is short and stable —
// new recipes rarely introduce new brand names, so this doesn't need to
// keep growing the way ingredient-specific overrides do. This is the
// scalable fix: instead of hand-fixing every ingredient Fuse gets wrong,
// detect and downrank the kind of entry that's usually wrong (branded/
// restaurant/fast-food items) directly.
const BRAND_NAMES = [
  'KFC', 'McDONALD', 'DENNY', 'BURGER KING', 'POPEYES', 'APPLEBEE',
  'T.G.I. FRIDAY', 'Oscar Mayer', 'Pillsbury', 'Kraft', 'CRACKER BARREL',
  'WENDY', 'TACO BELL', 'SUBWAY', 'PIZZA HUT', 'DOMINO', 'STARBUCKS',
  'DUNKIN', "CHICK-FIL-A", 'SONIC', 'ARBY', 'HARDEE', 'CARL JR',
  'JACK IN THE BOX', 'WHITE CASTLE', 'CHIPOTLE', 'PANERA', 'DAIRY QUEEN',
  'IHOP', 'OUTBACK', 'OLIVE GARDEN', 'RED LOBSTER', 'BASKIN', 'HERSHEY',
  'NESTLE', 'GENERAL MILLS', 'KELLOGG', 'QUAKER', 'RALSTON', 'MALT-O-MEAL',
  'M&M', 'MARS SNACKFOOD', 'SPECIAL DARK', 'PLANTERS', 'BREAKSTONE',
  'MINUTE MAID', 'ON THE BORDER', 'FRIENDLY', 'ORE-IDA', 'TOSTITOS',
  'FRITO', 'DORITOS', 'SKIPPY', 'SMUCKER', 'CAMPBELL', 'PROGRESSO',
  'BUITONI', 'STOUFFER', 'LEAN CUISINE', 'BOCA ', 'MORNINGSTAR', 'TOFURKY',
  'GORTON', 'TYSON', 'PERDUE', 'JOHNSONVILLE', 'BALL PARK', 'HORMEL',
  'SPAM', 'VIENNA ', 'ARMOUR ',
];
const BRAND_PATTERN = new RegExp(BRAND_NAMES.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

// Category prefixes USDA uses for restaurant/institutional/branded foods
// generally, even when no specific brand name is present.
const RESTAURANT_PREFIX_PATTERN = /^(Restaurant,|Fast [Ff]oods?,|Fast Food,|School Lunch,|Babyfood,)/;

// Catches remaining ALL-CAPS brand-style tokens not in the explicit list
// above (many store brands follow this convention in USDA data).
const ALLCAPS_BRAND_PATTERN = /\b[A-Z]{3,}('S)?\b/;

function looksLikeBrandedOrRestaurant(name) {
  return RESTAURANT_PREFIX_PATTERN.test(name) || BRAND_PATTERN.test(name) || ALLCAPS_BRAND_PATTERN.test(name);
}

/**
 * Penalize names that look "compound," branded, or restaurant/fast-food
 * in origin, so plain/generic ingredients are preferred when both are
 * plausible matches. Two signals combine:
 *   1. Structural complexity (more commas/words = more likely a modified
 *      or branded product, e.g. "Chicken, breast, roll, oven-roasted")
 *   2. Detected brand/restaurant markers (a much stronger signal, applied
 *      as a heavier penalty since it's a near-certain sign of the wrong
 *      kind of entry for a generic recipe ingredient)
 */
function complexityPenalty(name) {
  const commaCount = (name.match(/,/g) || []).length;
  const wordCount = name.split(/\s+/).length;
  const structuralPenalty = commaCount * 0.04 + wordCount * 0.01;
  const brandPenalty = looksLikeBrandedOrRestaurant(name) ? 0.8 : 0;
  return structuralPenalty + brandPenalty;
}

/**
 * Given a single ingredient name parsed from a recipe (e.g. "olive oil"),
 * return the top N candidate matches from the USDA ingredient dataset.
 *
 * Ranking combines Fuse's fuzzy string score with a complexity penalty so
 * plain/generic ingredient names are preferred over branded or heavily
 * modified ones when both are plausible matches. A small staple override
 * list handles the most common ingredients directly, since USDA's
 * reversed naming order ("Oil, olive" vs "olive oil") otherwise causes
 * fuzzy matching to favor coincidental substring matches over the plain form.
 *
 * @param {string} queryName - the ingredient name to match, e.g. "flour"
 * @param {number} maxResults - how many candidates to return (default 3)
 * @returns {Array<{ fdc_id: number, name: string, score: number, ...nutritionFields }>}
 */
export function matchIngredient(queryName, maxResults = 3) {
  if (!queryName || typeof queryName !== 'string') {
    return [];
  }

  const cleaned = queryName.trim().toLowerCase();
  if (cleaned.length === 0) {
    return [];
  }

  // Check staple overrides first — if the query matches a known staple,
  // put that exact item at the top of the results.
  let overrideItem = null;
  if (STAPLE_OVERRIDES[cleaned]) {
    overrideItem = ingredients.find(i => i.name === STAPLE_OVERRIDES[cleaned]);
  }

  const rawResults = fuse.search(cleaned, { limit: maxResults * 4 }); // grab extra candidates before re-ranking

  const reranked = rawResults
    .map(r => ({
      item: r.item,
      // combine Fuse's fuzzy score with the complexity penalty
      adjustedScore: r.score + complexityPenalty(r.item.name),
      rawScore: r.score,
    }))
    .sort((a, b) => a.adjustedScore - b.adjustedScore)
    .slice(0, maxResults)
    .map(r => ({
      ...r.item,
      matchScore: r.rawScore,
      confidence: scoreToConfidence(r.adjustedScore),
    }));

  if (overrideItem) {
    // dedupe in case the override item also came back naturally, then
    // put it first and trim back to maxResults
    const withoutDupe = reranked.filter(r => r.fdc_id !== overrideItem.fdc_id);
    return [
      { ...overrideItem, matchScore: 0, confidence: 'high' },
      ...withoutDupe,
    ].slice(0, maxResults);
  }

  return reranked;
}

/**
 * Convert Fuse's raw score (0 = perfect, 1 = worst) into a rough
 * human-readable confidence label for the UI.
 */
function scoreToConfidence(score) {
  if (score <= 0.1) return 'high';
  if (score <= 0.25) return 'medium';
  return 'low';
}

/**
 * Batch version: match a whole parsed recipe's ingredient list at once.
 * Input shape matches what parseRecipe.js is expected to output.
 *
 * @param {Array<{ quantity: number, unit: string, ingredientName: string }>} parsedIngredients
 * @returns {Array<{ original: object, candidates: Array }>}
 */
export function matchIngredients(parsedIngredients) {
  return parsedIngredients.map(parsed => ({
    original: parsed,
    candidates: matchIngredient(parsed.ingredientName),
  }));
}