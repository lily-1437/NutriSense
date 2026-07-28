// src/logic/dailyQuote.js
//
// Fetches one motivational wellness quote per calendar day from Gemini,
// caching the result in localStorage so it's only requested once per day
// (and instantly available on repeat visits/refreshes that same day).
//
// Mirrors the model choice already confirmed working in goalInference.js:
// use 'gemini-flash-latest'. Do NOT use 'gemini-2.5-flash-lite' (404 on new
// keys) or 'gemini-2.0-flash' (hits quota/429).

const CACHE_KEY = 'nutrisense_daily_quote';
const MODEL = 'gemini-flash-latest';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.dateKey !== todayKey()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(quote, author) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ dateKey: todayKey(), quote, author })
    );
  } catch {
    // localStorage unavailable — fail silently, just re-fetch next time
  }
}

const PROMPT = `Give me one short, original motivational quote (max 24 words) about
healthy eating, fitness, mindfulness, or personal growth, suitable for a nutrition
app's daily "Quote of the Day" card. Respond ONLY with strict JSON, no markdown,
no code fences, in exactly this shape:
{"quote": "...", "author": "..."}
If the quote is original/unattributed, set "author" to "NutriSense".`;

/**
 * Returns { quote, author } — from cache if already fetched today,
 * otherwise calls Gemini and caches the result.
 * @param {boolean} forceRefresh - bypass cache (used by the refresh button)
 */
export async function getDailyQuote(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return { quote: cached.quote, author: cached.author };
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }] }],
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Gemini request failed (${res.status})`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const clean = text.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('Could not parse Gemini response');
  }

  const quote = parsed.quote?.trim();
  const author = parsed.author?.trim() || 'NutriSense';
  if (!quote) throw new Error('Empty quote returned');

  writeCache(quote, author);
  return { quote, author };
}
