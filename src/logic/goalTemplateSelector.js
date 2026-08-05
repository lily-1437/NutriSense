// src/logic/goalTemplateSelector.js
// Selects a health goal from the predefined template set in
// healthGoalTemplates.json, rather than having Gemini invent milestones
// freeform. This mirrors mealPlanSelector.js's "deterministic template
// selection for safety-critical assignment, AI scoped to interpretation
// only" pattern (see project's key learnings).
//
// Two-tier selection:
//   1. Keyword match against each template's `keywords` list — fast, free,
//      fully deterministic, no API call needed for the common case.
//   2. If no keyword match, fall back to Gemini as a CLASSIFIER ONLY — it
//      returns one of the known template keys, never new milestone content.
//      This keeps AI involvement visible/auditable: it picks, it doesn't invent.

import healthGoalTemplates from '../data/healthGoalTemplates.json';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

const TEMPLATE_KEYS = Object.keys(healthGoalTemplates);

// Maps each ConditionSelector.jsx CONDITION_OPTIONS value to its matching
// template key -- deterministic, inspectable, no AI involved. Used as a
// priority signal: if the user has exactly one relevant condition and the
// description doesn't clearly point elsewhere, we lean on this mapping first.
export const CONDITION_TEMPLATE_MAP = {
  'Diabetes (Type 1)': 'diabetes_management',
  'Diabetes (Type 2)': 'diabetes_management',
  'Hypertension': 'blood_pressure',
  'High Cholesterol': 'high_cholesterol',
  'Heart Disease': 'heart_health',
  'Kidney Disease': 'kidney_health',
  'Celiac Disease / Gluten Intolerance': 'celiac_gluten_free',
  'Lactose Intolerance': 'lactose_intolerance',
  'IBS': 'ibs_management',
  'Obesity / Weight Management': 'weight_loss',
  'Nut Allergy': 'nut_allergy_safety',
  'Shellfish Allergy': 'shellfish_allergy_safety',
  'Pregnancy': 'pregnancy_nutrition',
};

function conditionMatch(description, conditions) {
  if (!conditions.length) return null;
  const text = description.toLowerCase();

  // If the description also contains a keyword for a DIFFERENT template,
  // don't override it with the condition mapping -- the user's stated intent
  // in this specific goal takes priority (e.g. a diabetic user writing "I
  // want to build muscle" should get muscle_gain, not diabetes_management).
  const describedKey = keywordMatch(description);
  if (describedKey) return null;

  // Otherwise, if exactly one saved condition maps to a template, use it.
  const mappedKeys = [...new Set(
    conditions.map((c) => CONDITION_TEMPLATE_MAP[c]).filter(Boolean),
  )];
  return mappedKeys.length === 1 ? mappedKeys[0] : null;
}

function keywordMatch(description) {
  const text = description.toLowerCase();
  for (const key of TEMPLATE_KEYS) {
    const { keywords } = healthGoalTemplates[key];
    if (keywords.some((kw) => text.includes(kw))) {
      return key;
    }
  }
  return null;
}

async function classifyWithGemini(description, conditions) {
  const conditionsLine = conditions.length
    ? `User's known health conditions: ${conditions.join(', ')}.`
    : 'User has no known health conditions on file.';

  const prompt = `You are a classifier. Given a user's health goal description, choose the
SINGLE best-fitting category from this exact list (respond with ONLY the key,
nothing else, no punctuation, no markdown):
${TEMPLATE_KEYS.join(', ')}

${conditionsLine}

User's goal description: "${description}"

Respond with exactly one of: ${TEMPLATE_KEYS.join(', ')}`;

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!response.ok) return null;

    const data = await response.json();
    const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().toLowerCase();
    return TEMPLATE_KEYS.includes(raw) ? raw : null;
  } catch {
    return null;
  }
}

// Returns { templateKey, label, milestones, rationale } or { error }.
// Milestones are deep-cloned + given fresh ids so the caller can freely
// edit values without mutating the shared template.
export async function selectGoalTemplate(description, conditions = []) {
  if (!description || !description.trim()) {
    return { error: 'Please describe your goal first.' };
  }

  let key = keywordMatch(description);
  let matchedBy = 'keyword';

  if (!key) {
    key = conditionMatch(description, conditions);
    matchedBy = 'condition';
  }

  if (!key) {
    key = await classifyWithGemini(description, conditions);
    matchedBy = 'ai';
  }

  if (!key) {
    return { error: 'Could not match that goal to a known template. Try adding more detail (e.g. mention weight, blood pressure, diabetes, or general wellness).' };
  }

  const template = healthGoalTemplates[key];
  const milestones = template.milestones.map((m, i) => ({
    ...m,
    id: `m${i}_${Date.now()}`,
  }));

  return {
    templateKey: key,
    label: template.label,
    milestones,
    rationale: matchedBy === 'keyword'
      ? `Matched to the "${template.label}" template based on your description.`
      : matchedBy === 'condition'
        ? `Matched to the "${template.label}" template based on your saved health condition.`
        : `AI classified this as "${template.label}" based on your description.`,
    conditionsConsidered: conditions,
  };
}

export { TEMPLATE_KEYS };
