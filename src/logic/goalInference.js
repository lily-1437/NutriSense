// src/logic/goalInference.js
// Turns a free-text goal ("I want to lose 2kg") + the user's saved health
// conditions into structured nutrition targets, via the Gemini API (client-side,
// same VITE_ key pattern as the rest of src/logic/).
//
// This is a SUGGESTION only — the caller must show the result to the user for
// review/edit before ever calling createGoal(). Never auto-save straight from
// inferGoalFromText().

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
const SYSTEM_INSTRUCTIONS = `You are a nutrition goal assistant. Given a user's free-text health goal
description and their known health conditions, infer a short list of measurable
milestones that together represent a reasonable plan toward that goal.

Rules:
- Return ONLY valid JSON, no markdown fences, no preamble.
- Top-level fields required: "milestones" (array, 3-5 items) and "rationale"
  (string, 1-2 plain-language sentences explaining the overall approach,
  mentioning any condition adjustments made).
- Each milestone object must have:
  - "icon": one of "Flame" (calories), "Droplet" (hydration/sodium/fluids),
    "Utensils" (meals/eating pattern), "Activity" (exercise), "Moon" (sleep/rest),
    "TrendingDown" (weight/reduction goals), "Heart" (general health checkpoint)
  - "label": short title, e.g. "Daily calorie target", "Sodium limit"
  - "detail": one short plain-language sentence explaining why this milestone matters
  - "value": a number (the editable target amount)
  - "unit": short unit string, e.g. "kcal/day", "mg/day", "min/day", "L/day", "x/week"
- Pick milestone types that actually fit the goal described (e.g. blood pressure
  -> sodium limit + exercise + calories; weight loss -> calories + protein +
  exercise; general wellness -> hydration + meals + activity).
- If conditions are present (e.g. diabetes, hypertension), adjust values
  conservatively and say so in rationale.
- Never suggest a calorie milestone below 1200 or above 4000 kcal/day.
- If the goal statement is unrelated to nutrition/health or too vague to infer
  milestones from, return { "error": "..." } explaining what's missing instead
  of guessing.`;

export async function inferGoalFromText(goalText, conditions = []) {
  if (!goalText || !goalText.trim()) {
    return { error: 'Please describe your goal first.' };
  }

  const conditionsLine = conditions.length
    ? `User's known health conditions: ${conditions.join(', ')}.`
    : 'User has no known health conditions on file.';

  const prompt = `${SYSTEM_INSTRUCTIONS}\n\n${conditionsLine}\n\nUser's goal description: "${goalText}"`;

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      return { error: 'Could not reach the goal assistant. Try again.' };
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.error) {
      return { error: parsed.error };
    }
    if (!Array.isArray(parsed.milestones) || parsed.milestones.length === 0) {
      return { error: 'Could not generate milestones for that goal. Try adding more detail.' };
    }

    const ALLOWED_ICONS = ['Flame', 'Droplet', 'Utensils', 'Activity', 'Moon', 'TrendingDown', 'Heart'];

    const milestones = parsed.milestones.map((m, i) => ({
      id: `m${i}_${Date.now()}`,
      icon: ALLOWED_ICONS.includes(m.icon) ? m.icon : 'Heart',
      label: m.label || 'Milestone',
      detail: m.detail || '',
      value: Number(m.value) || 0,
      unit: m.unit || '',
    }));

    return {
      milestones,
      rationale: parsed.rationale || '',
      sourceText: goalText,
      conditionsConsidered: conditions,
    };
  } catch (err) {
    return { error: 'Could not understand that goal. Try rephrasing it.' };
  }
}
