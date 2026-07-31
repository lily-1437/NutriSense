// src/logic/recipeOverrideMatcher.js
import overridesData from '../data/recipeOverrides.json';

function normalize(str) {
  return str.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

export function findRecipeOverride(rawText) {
  const firstLine = rawText.split('\n').map((l) => l.trim()).find(Boolean) || '';
  const key = normalize(firstLine);
  return overridesData.recipes[key] || null;
}