// src/logic/mealPlanSelector.js
// Selects the correct predefined template based on the user's actual
// conditions[]. Deterministic and auditable — this is the safety-relevant
// layer and intentionally has NO AI involvement, same reasoning as
// riskFlagging.js and matchIngredient.js.

import templatesData from '../data/mealPlanTemplates.json';

// Priority matters when a user has multiple conditions — more restrictive/
// safety-critical conditions should win the match. Adjust order as needed.
const CONDITION_PRIORITY = [
  'Kidney Disease',
  'Diabetes (Type 1)',
  'Diabetes (Type 2)',
  'Heart Disease',
  'Hypertension',
  'High Cholesterol',
  'Pregnancy',
  'IBS',
  'Obesity / Weight Management',
];

// The dedicated "no conditions on file" template (id: 'no_health_condition',
// condition: 'Healthy' in mealPlanTemplates.json). Used for both fallback
// cases below — previously both fell back to 'obesity_weight_management',
// which isn't a "no condition" plan at all, it's a specific weight-
// management plan; a user with no conditions (or with conditions that
// don't map to anything we have) would incorrectly get weight-management
// meals/tips instead of a genuinely general-wellness plan.
function getNoConditionTemplate(templates) {
  return templates.find((t) => t.id === 'no_health_condition') || templates[0];
}

/**
 * @param {string[]} userConditions - from firestoreUser.js
 * @returns {{ template: object, matchedCondition: string|null, fallback: boolean }}
 */
export function selectMealPlanTemplate(userConditions = []) {
  const templates = templatesData.templates;

  if (!userConditions || userConditions.length === 0) {
    // No conditions on file — use the dedicated no-health-condition template.
    return { template: getNoConditionTemplate(templates), matchedCondition: null, fallback: true };
  }

  // Walk the priority list, return the first condition the user actually has
  // that also has a template.
  for (const condition of CONDITION_PRIORITY) {
    if (userConditions.includes(condition)) {
      const match = templates.find((t) => t.condition === condition);
      if (match) {
        return { template: match, matchedCondition: condition, fallback: false };
      }
    }
  }

  // User has condition(s) but none map to a template we have.
  return { template: getNoConditionTemplate(templates), matchedCondition: null, fallback: true };
}

export function getAllTemplateSummaries() {
  return templatesData.templates.map((t) => ({
    id: t.id,
    condition: t.condition,
    goalTypeTags: t.goalTypeTags,
  }));
}
