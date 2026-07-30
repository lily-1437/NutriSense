// src/logic/riskFlagging.js
//
// Increment 3: Condition-Aware Risk Flagging.
//
// Takes the conditions a user has set (via ConditionSelector, saved with
// firestoreUser.js) plus an analyzed recipe's per-serving nutrition +
// matched ingredients, and returns a list of risk flags -- things worth
// warning the user about given their specific conditions.
//
// Two kinds of rules, since "risky" means different things depending on
// the condition:
//   1. THRESHOLD rules -- a nutrient value per serving crosses a line
//      (e.g. sodium too high for someone with hypertension).
//   2. INGREDIENT rules -- specific ingredients are flagged by keyword,
//      regardless of nutrient values (e.g. peanuts for a nut allergy --
//      there's no "safe amount" of peanut for an allergy, so this can't
//      be a threshold check).
//
// Condition keys here must exactly match CONDITION_OPTIONS in
// ConditionSelector.jsx -- these two lists are the single source of truth
// for what "conditions" means across the app, and must stay in sync.

const SEVERITY = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' };

// perServing nutrient keys this checks against, matching what
// calculateNutrition.js / analyzeRecipe.js already produce per serving:
//   calories, protein, fat, carbs, sat_fat, fiber, sugar, sodium

const CONDITION_RULES = {
  'Diabetes (Type 1)': {
    thresholdRules: [
      {
        nutrientKey: 'sugar',
        max: 25,
        severity: SEVERITY.HIGH,
        message: 'High sugar content per serving may cause a blood glucose spike.',
      },
      {
        nutrientKey: 'carbs',
        max: 60,
        severity: SEVERITY.MEDIUM,
        message: 'High carbohydrate content per serving -- consider insulin/dosing needs.',
      },
    ],
  },
  'Diabetes (Type 2)': {
    thresholdRules: [
      {
        nutrientKey: 'sugar',
        max: 25,
        severity: SEVERITY.HIGH,
        message: 'High sugar content per serving may cause a blood glucose spike.',
      },
      {
        nutrientKey: 'carbs',
        max: 60,
        severity: SEVERITY.MEDIUM,
        message: 'High carbohydrate content per serving.',
      },
    ],
  },
  Hypertension: {
    thresholdRules: [
      {
        nutrientKey: 'sodium',
        max: 600,
        severity: SEVERITY.HIGH,
        message: 'High sodium content per serving -- a concern for blood pressure management.',
      },
    ],
  },
  'High Cholesterol': {
    thresholdRules: [
      {
        nutrientKey: 'sat_fat',
        max: 6,
        severity: SEVERITY.MEDIUM,
        message: 'High saturated fat per serving may affect cholesterol levels.',
      },
    ],
  },
  'Heart Disease': {
    thresholdRules: [
      {
        nutrientKey: 'sodium',
        max: 500,
        severity: SEVERITY.HIGH,
        message: 'High sodium content per serving -- a concern for heart health.',
      },
      {
        nutrientKey: 'sat_fat',
        max: 5,
        severity: SEVERITY.MEDIUM,
        message: 'High saturated fat per serving.',
      },
    ],
  },
  'Kidney Disease': {
    thresholdRules: [
      {
        nutrientKey: 'sodium',
        max: 500,
        severity: SEVERITY.HIGH,
        message: 'High sodium content per serving -- kidneys may struggle to process excess sodium.',
      },
      {
        nutrientKey: 'protein',
        max: 40,
        severity: SEVERITY.MEDIUM,
        message: 'High protein per serving -- discuss protein intake limits with your care team.',
      },
    ],
  },
  'Celiac Disease / Gluten Intolerance': {
    keywordRules: [
      {
        keywords: ['wheat', 'barley', 'rye', 'flour', 'bread', 'pasta', 'couscous', 'semolina', 'malt'],
        severity: SEVERITY.HIGH,
        message: 'Contains gluten -- unsafe for celiac disease / gluten intolerance.',
      },
    ],
  },
  'Lactose Intolerance': {
    keywordRules: [
      {
        keywords: ['milk', 'cheese', 'cream', 'butter', 'yogurt', 'whey', 'lactose'],
        severity: SEVERITY.MEDIUM,
        message: 'Contains dairy -- may cause discomfort with lactose intolerance.',
      },
    ],
  },
  IBS: {
    keywordRules: [
      {
        keywords: ['garlic', 'onion', 'beans', 'lentils', 'wheat', 'milk', 'cream'],
        severity: SEVERITY.LOW,
        message: 'Common IBS trigger ingredient -- effects vary by individual.',
      },
    ],
  },
  'Obesity / Weight Management': {
    thresholdRules: [
      {
        nutrientKey: 'calories',
        max: 700,
        severity: SEVERITY.MEDIUM,
        message: 'High calorie content per serving relative to a weight-management goal.',
      },
    ],
  },
  'Nut Allergy': {
    keywordRules: [
      {
        keywords: ['peanut', 'almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia'],
        severity: SEVERITY.HIGH,
        message: 'Contains nuts -- unsafe for a nut allergy.',
      },
    ],
  },
  'Shellfish Allergy': {
    keywordRules: [
      {
        keywords: ['shrimp', 'crab', 'lobster', 'shellfish', 'prawn', 'oyster', 'clam', 'mussel', 'scallop'],
        severity: SEVERITY.HIGH,
        message: 'Contains shellfish -- unsafe for a shellfish allergy.',
      },
    ],
  },
  Pregnancy: {
    keywordRules: [
      {
        keywords: ['raw egg', 'unpasteurized', 'raw fish', 'sushi', 'deli meat', 'soft cheese', 'alcohol', 'wine', 'beer'],
        severity: SEVERITY.HIGH,
        message: 'May not be safe during pregnancy -- check with your provider.',
      },
    ],
  },
};

function checkThresholdRules(condition, rules, perServing) {
  const flags = [];
  for (const rule of rules) {
    const value = perServing?.[rule.nutrientKey];
    if (typeof value === 'number' && value > rule.max) {
      flags.push({
        condition,
        type: 'threshold',
        severity: rule.severity,
        nutrientKey: rule.nutrientKey,
        value,
        threshold: rule.max,
        message: rule.message,
      });
    }
  }
  return flags;
}

function checkKeywordRules(condition, rules, ingredients) {
  const flags = [];
  for (const rule of rules) {
    for (const ingredient of ingredients ?? []) {
      const name = (
        ingredient.matchedItem?.name ||
        ingredient.original?.raw ||
        ''
      ).toLowerCase();
      const hit = rule.keywords.find((kw) => name.includes(kw));
      if (hit) {
        flags.push({
          condition,
          type: 'ingredient',
          severity: rule.severity,
          ingredientName: ingredient.matchedItem?.name || ingredient.original?.raw,
          matchedKeyword: hit,
          message: rule.message,
        });
      }
    }
  }
  return flags;
}

/**
 * Returns an array of risk flags for the given user conditions against an
 * analyzed recipe's per-serving nutrition + matched ingredients.
 *
 * @param {string[]} conditions - values from CONDITION_OPTIONS the user has set
 * @param {{ perServing: object, ingredients: array }} recipeData
 * @returns {Array<{condition, type, severity, message, ...}>}
 */
export function flagRisks(conditions, { perServing, ingredients }) {
  if (!conditions?.length) return [];

  const flags = [];
  for (const condition of conditions) {
    const rules = CONDITION_RULES[condition];
    if (!rules) continue; // condition has no rules defined yet
    if (rules.thresholdRules) {
      flags.push(...checkThresholdRules(condition, rules.thresholdRules, perServing));
    }
    if (rules.keywordRules) {
      flags.push(...checkKeywordRules(condition, rules.keywordRules, ingredients));
    }
  }

  // Highest severity first so the worst flags surface at the top of any list.
  const severityOrder = { high: 0, medium: 1, low: 2 };
  return flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export { SEVERITY };
