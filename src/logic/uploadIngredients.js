import { db } from "../firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import ingredients from "../data/ingredients.json";

/**
 * One-time script to upload the ingredients dataset to Firestore.
 * Run this once, then remove it from the app.
 */
export async function uploadIngredients() {
  const BATCH_SIZE = 450; // Firestore allows max 500 writes per batch; staying safely under
  let uploaded = 0;

  for (let i = 0; i < ingredients.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = ingredients.slice(i, i + BATCH_SIZE);

    chunk.forEach((ingredient) => {
      const docRef = doc(db, "ingredients", String(ingredient.fdc_id));
      batch.set(docRef, {
        name: ingredient.name,
        calories: ingredient.calories,
        protein: ingredient.protein,
        carbs: ingredient.carbs,
        fat: ingredient.fat,
        sugar: ingredient.sugar,
        fiber: ingredient.fiber,
        sat_fat: ingredient.sat_fat,
        sodium: ingredient.sodium,
      });
    });

    await batch.commit();
    uploaded += chunk.length;
    console.log(`Uploaded ${uploaded} / ${ingredients.length}`);
  }

  console.log("Upload complete!");
}