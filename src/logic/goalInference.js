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
const SYSTEM_INSTRUCTIONS = `You are a nutrition goal assistant. Given a user's free-text goal statement and their
known health conditions, infer a reasonable structured daily nutrition target.

Rules:
- Return ONLY valid JSON, no markdown fences, no preamble.
- Fields required: targetCalories (integer), targetProtein (integer, grams),
  targetFat (integer, grams), targetCarbs (integer, grams), timeframe (one of
  "weekly" or "monthly"), rationale (string, 1-2 plain-language sentences
  explaining why these numbers were chosen, mentioning any condition
  adjustments made).
- If conditions are present (e.g. diabetes, hypertension), adjust targets
  conservatively (e.g. lower simple-carb allowance for diabetes, lower sodium
  is out of scope here, focus only on calories/macros) and say so in rationale.
- Never suggest calorie targets below 1200 or above 4000, regardless of the request.
- If the goal statement is unrelated to nutrition or too vague to infer numbers
  from, return { "error": "..." } explaining what's missing instead of guessing.`;

export async function inferGoalFromText(goalText, conditions = []) {
  if (!goalText || !goalText.trim()) {
    return { error: 'Please describe your goal first.' };
  }

  const conditionsLine = conditions.length
    ? `User's known health conditions: ${conditions.join(', ')}.`
    : 'User has no known health conditions on file.';

  const prompt = `${SYSTEM_INSTRUCTIONS}\n\n${conditionsLine}\n\nUser's goal statement: "${goalText}"`;

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

    return {
      targetCalories: Math.round(parsed.targetCalories),
      targetProtein: Math.round(parsed.targetProtein),
      targetFat: Math.round(parsed.targetFat),
      targetCarbs: Math.round(parsed.targetCarbs),
      timeframe: parsed.timeframe === 'monthly' ? 'monthly' : 'weekly',
      rationale: parsed.rationale || '',
      sourceText: goalText,
      conditionsConsidered: conditions,
    };
  } catch (err) {
    return { error: 'Could not understand that goal. Try rephrasing it.' };
  }
}
