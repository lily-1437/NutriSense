/**
 * parseRecipe.js
 *
 * Takes raw recipe text (however the user pasted it) and extracts a list of
 * structured ingredient lines: { quantity, unit, ingredientName, raw }.
 *
 * Handles two input styles, since users won't paste consistently:
 *   1. One ingredient per line:
 *        "2 cups flour"
 *        "1 tbsp olive oil"
 *   2. Free-form paragraph/sentence style:
 *        "Mix 2 cups of flour with 1 tbsp olive oil and a pinch of salt."
 *
 * Quantity is usually present but not guaranteed — lines like "salt to taste"
 * or "salt" alone must still produce a usable ingredientName with a null
 * quantity/unit, rather than being dropped.
 */

// Unicode fraction characters (as seen in copy-pasted recipes) mapped to
// their ASCII equivalents, so "½ cup" is treated the same as "1/2 cup".
const UNICODE_FRACTIONS = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
  '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5',
  '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
};
const UNICODE_FRACTION_REGEX = new RegExp(`[${Object.keys(UNICODE_FRACTIONS).join('')}]`, 'g');

/**
 * Replace unicode fraction glyphs with ASCII equivalents, and insert a
 * space between a whole number and an immediately-following fraction
 * glyph (e.g. "1½" -> "1 1/2") so downstream regexes work unchanged.
 */
function normalizeFractions(text) {
  return text
    .replace(/(\d)([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, '$1 $2') // "1½" -> "1 ½"
    .replace(UNICODE_FRACTION_REGEX, match => UNICODE_FRACTIONS[match]);
}

// Units recognized during parsing. Keys are the canonical form; values are
// alternate spellings/abbreviations that should map to it. Extend this list
// as real recipes surface units we haven't seen yet.
const UNIT_ALIASES = {
  cup: ['cup', 'cups', 'c'],
  tbsp: ['tbsp', 'tbsps', 'tablespoon', 'tablespoons', 'tbs'],
  tsp: ['tsp', 'tsps', 'teaspoon', 'teaspoons'],
  oz: ['oz', 'ozs', 'ounce', 'ounces'],
  lb: ['lb', 'lbs', 'pound', 'pounds'],
  g: ['g', 'gram', 'grams'],
  kg: ['kg', 'kilogram', 'kilograms'],
  ml: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'],
  l: ['l', 'liter', 'liters', 'litre', 'litres'],
  pinch: ['pinch', 'pinches'],
  clove: ['clove', 'cloves'],
  slice: ['slice', 'slices'],
  can: ['can', 'cans'],
  piece: ['piece', 'pieces'],
};

// Flatten aliases into a single lookup: "tablespoons" -> "tbsp"
const UNIT_LOOKUP = {};
for (const [canonical, aliases] of Object.entries(UNIT_ALIASES)) {
  aliases.forEach(alias => {
    UNIT_LOOKUP[alias] = canonical;
  });
}

// Sort alias strings longest-first so the regex doesn't match "c" inside
// "cups" before trying the full word.
const UNIT_PATTERN = Object.keys(UNIT_LOOKUP)
  .sort((a, b) => b.length - a.length)
  .join('|');

// Matches a leading quantity: whole numbers, decimals, simple fractions
// (1/2), mixed numbers (1 1/2), or ranges (2-4, 2–4). For ranges, the
// average of the two numbers is used as a reasonable single-value estimate.
const QUANTITY_REGEX = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?|\d+(?:\.\d+)?)\s*/;

// Matches a unit immediately following the quantity.
const UNIT_REGEX = new RegExp(`^(${UNIT_PATTERN})\\b\\.?\\s*(?:of\\s+)?`, 'i');

// Trailing prep/descriptor phrases that aren't part of the ingredient's
// identity for matching purposes (e.g. "onion, diced" -> "onion").
// Stripped from the end of the ingredient name but not discarded entirely —
// kept in `prepNote` in case later features want them (e.g. substitution UI).
const PREP_DESCRIPTORS = [
  'to taste', 'optional', 'chopped', 'diced', 'minced', 'sliced', 'grated',
  'crushed', 'peeled', 'finely chopped', 'roughly chopped', 'melted',
  'softened', 'room temperature', 'divided', 'packed', 'freshly ground',
  'julienned', 'julienne', 'cubed', 'halved', 'quartered', 'thinly sliced',
  'shredded', 'zested', 'juiced', 'trimmed', 'rinsed', 'drained', 'beaten',
];

// Leading size/quantity-adjective words that don't affect nutrition
// matching identity (a "small onion" and "onion" are the same USDA item,
// just different serving sizes) — stripped from the front of the name so
// staple overrides and fuzzy matching both work against the bare noun.
const SIZE_DESCRIPTORS = ['small', 'medium', 'large', 'extra small', 'extra large'];

function stripLeadingSize(name) {
  const lower = name.toLowerCase();
  for (const size of SIZE_DESCRIPTORS) {
    if (lower.startsWith(size + ' ')) {
      return name.slice(size.length).trim();
    }
  }
  return name;
}

/**
 * Convert a quantity string like "1/2" or "1 1/2" or "2" into a decimal.
 */
function parseQuantityValue(str) {
  if (!str) return null;
  const trimmed = str.trim();

  // Range: "2-4" or "2–4" (hyphen or en-dash) -> average the two values
  const rangeMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const [, low, high] = rangeMatch;
    return (Number(low) + Number(high)) / 2;
  }

  // Mixed number: "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const [, whole, num, den] = mixedMatch;
    return Number(whole) + Number(num) / Number(den);
  }

  // Simple fraction: "1/2"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const [, num, den] = fractionMatch;
    return Number(num) / Number(den);
  }

  // Plain number or decimal
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

/**
 * Strip a trailing prep descriptor (after a comma or "to taste") from an
 * ingredient name, returning both the cleaned name and the note.
 * e.g. "onion, diced" -> { name: "onion", prepNote: "diced" }
 */
function extractPrepNote(text) {
  let name = text.trim();
  let prepNote = null;

  // Strip parenthetical content entirely, e.g. "bread (white, whole wheat,
  // or sourdough)" -> "bread". Alternatives/asides in parens aren't part
  // of the ingredient's identity for matching purposes. Handles unclosed
  // parens too (in case punctuation was consumed elsewhere first).
  name = name.replace(/\([^)]*\)?/g, '').trim();

  // Check comma-separated trailing descriptor, e.g. "onion, diced"
  const commaIdx = name.lastIndexOf(',');
  if (commaIdx !== -1) {
    const after = name.slice(commaIdx + 1).trim().toLowerCase();
    if (PREP_DESCRIPTORS.some(desc => after === desc || after.includes(desc))) {
      prepNote = name.slice(commaIdx + 1).trim();
      name = name.slice(0, commaIdx).trim();
    }
  }

  // Check "to taste" or "optional" without a comma
  for (const desc of ['to taste', 'optional']) {
    const idx = name.toLowerCase().indexOf(desc);
    if (idx !== -1) {
      prepNote = prepNote ? `${prepNote}, ${desc}` : desc;
      name = name.slice(0, idx).trim();
    }
  }

  // Clean stray trailing punctuation left behind
  name = name.replace(/[\s,.()]+$/, '').trim();
  name = stripLeadingSize(name);

  return { name, prepNote };
}

/**
 * Parse a single ingredient segment (one line, or one clause pulled out of
 * a paragraph) into { quantity, unit, ingredientName, prepNote, raw }.
 */
function parseSegment(segment) {
  const raw = segment.trim();
  if (!raw) return null;

  let remaining = raw;
  let quantity = null;
  let unit = null;

  const qMatch = remaining.match(QUANTITY_REGEX);
  if (qMatch) {
    quantity = parseQuantityValue(qMatch[1]);
    remaining = remaining.slice(qMatch[0].length);

    const uMatch = remaining.match(UNIT_REGEX);
    if (uMatch) {
      unit = UNIT_LOOKUP[uMatch[1].toLowerCase()] || uMatch[1].toLowerCase();
      remaining = remaining.slice(uMatch[0].length);
    }
  }

  const { name, prepNote } = extractPrepNote(remaining);

  if (!name) return null; // nothing usable left (e.g. a stray number/unit only)

  return {
    quantity,   // number or null
    unit,       // canonical unit string or null
    ingredientName: name,
    prepNote,   // string or null, e.g. "diced", "to taste"
    raw,
  };
}

/**
 * Split free-form paragraph text into individual ingredient-like clauses.
 * This is a heuristic split on common separators used when people describe
 * ingredients in sentence form rather than a list.
 */
function splitParagraphIntoClauses(text) {
  return text
    // normalize "and" joins into separators so "flour and sugar" splits
    .replace(/\band\b/gi, ',')
    // split on commas, periods, and semicolons
    .split(/[,;.]/)
    .map(s => s.trim())
    .filter(Boolean);
}

// Verbs that signal a cooking *instruction* rather than an ingredient
// listing. A clause starting with one of these (after trimming) is treated
// as an instruction and skipped, even if it contains a quantity/unit
// (e.g. "Bake for 20 minutes at 350 degrees" has a number but is not an
// ingredient). NOTE: a clause like "Mix 2 cups of flour with 1 tbsp olive
// oil" also gets skipped entirely since it starts with "Mix" — this is a
// real limitation (see notes below); ingredients embedded mid-instruction
// are not currently recovered.
const INSTRUCTION_LEAD_VERBS = [
  'mix', 'add', 'bake', 'stir', 'cook', 'heat', 'pour', 'combine', 'whisk',
  'place', 'put', 'boil', 'simmer', 'preheat', 'cut', 'chop', 'serve',
  'garnish', 'until', 'for', 'let', 'set', 'remove', 'transfer', 'season',
  'sprinkle', 'drizzle', 'fold', 'beat', 'knead', 'roll', 'spread', 'cover',
  'reduce', 'increase', 'continue', 'repeat', 'allow', 'rest',
];

function startsWithInstructionVerb(text) {
  const firstWord = text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
  return INSTRUCTION_LEAD_VERBS.includes(firstWord);
}

// Lines that are just section headers, not ingredients or instructions.
function isHeaderOnly(text) {
  return /^(ingredients?|instructions?|directions?|method|steps?)\s*:?$/i.test(text.trim());
}

/**
 * Detect and handle "Name: value" style lines, e.g. "Cabbage: ½ cup, shredded"
 * or "Onion: 1 small, sliced" — a distinct format from quantity-first
 * lines, common when people format ingredients as a name-first list.
 *
 * Strategy: pull the quantity/unit out of the value part (after the colon),
 * then reassemble everything into the normal "quantity unit name, prep"
 * order and hand it to parseSegment(), so all the existing paren-stripping,
 * prep-note, and size-word logic is reused rather than duplicated.
 *
 * Returns null if the line doesn't look like this format (so the caller
 * falls through to normal handling) — e.g. if the part before the colon
 * contains a digit (likely a step number or something else, not a name).
 */
function tryParseColonLine(line) {
  const match = line.match(/^([A-Za-z][A-Za-z\s]{0,40}?):\s*(.+)$/);
  if (!match) return null;

  const namePart = match[1].trim();
  const valuePart = match[2].trim();

  if (isHeaderOnly(namePart)) return null;

  const qMatch = valuePart.match(QUANTITY_REGEX);

  if (!qMatch) {
    // No quantity in the value part (e.g. "Water: for boiling") — just
    // concatenate name and value naturally and parse as a normal segment.
    return parseSegment(`${namePart} ${valuePart}`.trim());
  }

  const quantityRaw = qMatch[1];
  let remainder = valuePart.slice(qMatch[0].length);

  let unitRaw = '';
  const uMatch = remainder.match(UNIT_REGEX);
  if (uMatch) {
    unitRaw = uMatch[1];
    remainder = remainder.slice(uMatch[0].length);
  }

  // Split whatever's left (e.g. "small, sliced" or ", sliced (optional)")
  // into a piece that belongs before the ingredient name (like a size
  // word) and a trailing prep descriptor piece.
  const commaIdx = remainder.indexOf(',');
  const beforeComma = (commaIdx !== -1 ? remainder.slice(0, commaIdx) : remainder).trim();
  const afterComma = commaIdx !== -1 ? remainder.slice(commaIdx + 1).trim() : null;

  const synthetic = `${quantityRaw} ${unitRaw} ${beforeComma} ${namePart}`
    .replace(/\s+/g, ' ')
    .trim() + (afterComma ? `, ${afterComma}` : '');

  return parseSegment(synthetic);
}

/**
 * Heuristic: is this line likely a recipe title rather than an ingredient?
 * Titles typically have no digits, no unit words, no comma, and are
 * relatively short. Only applied to the first non-empty line, since a
 * title mid-recipe is indistinguishable from a legitimately-named
 * ingredient without much more context (see note in parseRecipe below).
 */
function looksLikeTitle(text, strict = false) {
  const lower = text.toLowerCase();
  // "to taste" / "optional" are strong signals this is a real ingredient
  // line (e.g. "Salt to taste"), never a dish title — exclude immediately.
  if (lower.includes('to taste') || lower.includes('optional')) return false;

  const hasDigit = /\d/.test(text);
  const hasUnit = new RegExp(`\\b(${UNIT_PATTERN})\\b`, 'i').test(text);
  const hasComma = text.includes(',');
  const words = text.split(/\s+/);
  const wordCount = words.length;

  if (hasDigit || hasUnit || hasComma || wordCount > 6) return false;

  // For stricter checks (used on the last line, where a trailing
  // ingredient like "Salt" or "Black pepper" is just as likely as a
  // stray second recipe title), additionally require Title Case —
  // every word capitalized — since dish titles are reliably written
  // that way while plain ingredient names usually aren't.
  if (strict) {
    return words.every(w => /^[A-Z]/.test(w));
  }

  return true;
}

/**
 * Main entry point. Accepts raw recipe text (may be multi-line, may mix
 * list-style and paragraph-style content) and returns an array of parsed
 * ingredient objects.
 *
 * @param {string} rawText - the full pasted recipe text
 * @returns {Array<{ quantity: number|null, unit: string|null, ingredientName: string, prepNote: string|null, raw: string }>}
 */
export function parseRecipe(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const normalizedText = normalizeFractions(rawText);

  const lines = normalizedText
    .split('\n')
    .map(l => l.trim())
    // strip leading bullet markers: "* ", "- ", "• ", "1. ", etc.
    .map(l => l.replace(/^[\*\-•●○◦▪▸‣]\s*/, '').replace(/^\d+[.)]\s+/, ''))
    .filter(Boolean);

  const results = [];

  lines.forEach((line, index) => {
    if (isHeaderOnly(line)) return;
    // Skip likely recipe titles at the very start or very end of the
    // pasted text — the two places a bare dish name realistically shows
    // up (either this recipe's own title, or the start of a second
    // recipe accidentally pasted right after the first one's ingredients).
    const isFirstLine = index === 0;
    const isLastLine = index === lines.length - 1;
    if (isFirstLine && looksLikeTitle(line)) return;
    if (isLastLine && looksLikeTitle(line, true)) return; // stricter: require Title Case

    const colonParsed = tryParseColonLine(line);
    if (colonParsed) {
      results.push(colonParsed);
      return;
    }

    // Heuristic: if a line contains a quantity near the start AND doesn't
    // contain multiple quantities later on, treat it as a single
    // list-style ingredient line. Otherwise, treat it as a paragraph
    // clause and split further.
    const quantityMatches = line.match(/\d+(?:\/\d+)?/g) || [];
    const looksLikeSingleItem = QUANTITY_REGEX.test(line) && quantityMatches.length <= 1;

    if (looksLikeSingleItem) {
      const parsed = parseSegment(line);
      if (parsed) results.push(parsed);
    } else {
      // paragraph-style line (possibly with multiple ingredients embedded)
      const clauses = splitParagraphIntoClauses(line);
      for (const clause of clauses) {
        if (isHeaderOnly(clause)) continue;
        if (startsWithInstructionVerb(clause)) continue;

        // Skip clauses that are clearly instructions, not ingredients —
        // heuristic: no digits AND no recognizable unit AND longer than
        // ~4 words is likely an instruction fragment, not an ingredient.
        // This is imperfect; refine with real recipe samples.
        const hasDigit = /\d/.test(clause);
        const hasUnit = new RegExp(`\\b(${UNIT_PATTERN})\\b`, 'i').test(clause);
        const wordCount = clause.split(/\s+/).length;

        if (!hasDigit && !hasUnit && wordCount > 4) continue;

        const parsed = parseSegment(clause);
        if (parsed) results.push(parsed);
      }
    }
  });

  return results;
}