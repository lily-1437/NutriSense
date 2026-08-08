// src/logic/mealPlanNutrition.js
// Sums a single day's four meals into one totals object. Any field missing
// from ANY meal makes that field null for the whole day, rather than
// silently treating a missing value as 0 (which would understate the total).

const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'];
const METRIC_FIELDS = {
  calories: 'estCalories',
  protein: 'estProtein',
  fat: 'estFat',
  carbs: 'estCarbs',
};

export function sumDayNutrition(day) {
  const totals = {};
  for (const [metricKey, field] of Object.entries(METRIC_FIELDS)) {
    let sum = 0;
    let complete = true;
    for (const mealKey of MEAL_KEYS) {
      const meal = day?.meals?.[mealKey];
      if (!meal) continue; // a genuinely absent meal (e.g. no snack) doesn't break the total
      const val = meal[field];
      if (val === undefined || val === null) {
        complete = false;
        break;
      }
      sum += val;
    }
    totals[metricKey] = complete ? sum : null;
  }
  return totals;
}

export function sumWeekNutrition(days) {
  const perDay = (days || []).map(sumDayNutrition);
  const totals = {};
  for (const metricKey of Object.keys(METRIC_FIELDS)) {
    const values = perDay.map((d) => d[metricKey]);
    totals[metricKey] = values.some((v) => v === null) ? null : values.reduce((a, b) => a + b, 0);
  }
  return totals;
}