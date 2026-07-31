// src/logic/mealPlanCoach.js
// This is where Gemini's contribution is deliberately made VISIBLE in the
// product: it does NOT choose meals or touch condition-safety logic (that's
// mealPlanSelector.js, deterministic). Instead it writes a personalized
// weekly intro and a per-day "Coach's Note" grounded in the user's own goal
// text and condition — real generative work, scoped to something an LLM
// mistake can't hurt (encouragement copy, not meal selection).
//
// Model: gemini-flash-latest — do NOT use gemini-2.5-flash-lite (404 on new
// keys) or gemini-2.0-flash (hit 429/no quota previously).

const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

function buildPrompt({ condition, goalText, template }) {
  const dayList = template.days
    .map((d) => `${d.day}: ${d.meals.breakfast.recipeName}, ${d.meals.lunch.recipeName}, ${d.meals.dinner.recipeName}, ${d.meals.snack.recipeName}`)
    .join('\n');

  return `You are a supportive nutrition coach writing short, warm, specific copy for a
meal plan app. You do NOT choose meals or make medical claims — the meal plan below is
already finalized and condition-appropriate. Your only job is to write encouraging,
personalized text around it.

User's condition: ${condition || 'general wellness'}
User's own stated goal (in their words): ${goalText || 'no specific goal text provided — keep it general and encouraging'}

This week's finalized plan:
${dayList}

Return ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{
  "weeklyIntro": "2-3 sentence warm, specific intro referencing the user's actual goal/condition and what this week's plan does for them. No medical claims, no specific health outcome promises.",
  "dayNotes": [
    { "day": "Monday", "coachNote": "one short, specific, encouraging sentence about Monday's meals or a related tip" },
    { "day": "Tuesday", "coachNote": "..." },
    { "day": "Wednesday", "coachNote": "..." },
    { "day": "Thursday", "coachNote": "..." },
    { "day": "Friday", "coachNote": "..." },
    { "day": "Saturday", "coachNote": "..." },
    { "day": "Sunday", "coachNote": "..." }
  ]
}

Keep every "coachNote" under 20 words. Vary the phrasing across days — don't repeat the same sentence structure every day.`;
}

/**
 * Calls Gemini to generate personalized coach copy layered on top of an
 * already-selected, already-safe template. Never touches meal selection.
 *
 * @returns {{ weeklyIntro: string, dayNotes: Array<{day, coachNote}> }}
 */
export async function generateCoachNotes({ condition, goalText, template }) {
  const prompt = buildPrompt({ condition, goalText, template });

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Gemini coach request failed (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content for coach notes.');

  const cleaned = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed.weeklyIntro || !Array.isArray(parsed.dayNotes)) {
    throw new Error('Gemini coach response missing required fields.');
  }

  return parsed;
}

/**
 * Merges AI coach notes onto the template, falling back to the template's
 * own static healthTip per day if the AI call failed or is skipped — the
 * demo (and real users) should never see a broken plan because Gemini
 * had a bad day.
 */
export function mergeCoachNotes(template, coachNotes) {
  const noteByDay = new Map(
    (coachNotes?.dayNotes || []).map((n) => [n.day, n.coachNote])
  );

  return {
    ...template,
    aiGenerated: Boolean(coachNotes),
    weeklyIntro: coachNotes?.weeklyIntro || null,
    days: template.days.map((d) => ({
      ...d,
      coachNote: noteByDay.get(d.day) || d.healthTip, // fallback to static tip
    })),
  };
}