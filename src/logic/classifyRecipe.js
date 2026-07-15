import weights from "../data/classifierWeights.json";

// Standardize a single feature value (same as Python's StandardScaler)
function standardize(values, means, scales) {
  return values.map((v, i) => (v - means[i]) / scales[i]);
}

// Softmax function to convert raw scores into probabilities
function softmax(scores) {
  const maxScore = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - maxScore));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sumExps);
}

/**
 * Classifies a recipe's health level based on its nutrition values.
 * @param {Object} nutrition - { calories, protein, carbs, fat, sugar, fiber, sat_fat, sodium }
 * @returns {Object} { label: "Healthy"|"Moderate"|"Unhealthy", confidence: number, probabilities: Object }
 */
export function classifyRecipe(nutrition) {
  const { feature_names, classes, coefficients, intercepts, scaler_mean, scaler_scale } = weights;

  // Build the feature array in the exact order the model expects
  const rawValues = feature_names.map((name) => nutrition[name] ?? 0);

  // Standardize using the same mean/scale as training
  const scaledValues = standardize(rawValues, scaler_mean, scaler_scale);

  // Compute raw score for each class: (weights · features) + intercept
  const scores = coefficients.map((classCoefs, classIndex) => {
    const dotProduct = classCoefs.reduce((sum, coef, i) => sum + coef * scaledValues[i], 0);
    return dotProduct + intercepts[classIndex];
  });

  // Convert scores to probabilities
  const probabilities = softmax(scores);

  // Find the class with the highest probability
  let maxIndex = 0;
  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[maxIndex]) maxIndex = i;
  }

  const probMap = {};
  classes.forEach((cls, i) => {
    probMap[cls] = probabilities[i];
  });

  return {
    label: classes[maxIndex],
    confidence: probabilities[maxIndex],
    probabilities: probMap,
  };
}