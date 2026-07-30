// src/logic/firestoreRecipes.js
import { db } from '../firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, deleteDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';

const recipesRef = (uid) => collection(db, 'users', uid, 'recipes');

// Save a finished analysis (called from Stage 3 "Save to History")
export async function saveRecipe(uid, { recipeName, rawInput, ingredients, totals, perServing, servings, riskFlags = [] }) {
  const docRef = await addDoc(recipesRef(uid), {
    recipeName, rawInput, ingredients, totals, perServing, servings,
    createdAt: serverTimestamp(),
    riskFlags, // Increment 3: computed by riskFlagging.js before save
  });
  return docRef.id;
}

// Fetch one recipe (used by /history/:recipeId to hydrate Stage 3)
export async function getRecipe(uid, recipeId) {
  const snap = await getDoc(doc(db, 'users', uid, 'recipes', recipeId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Fetch all recipes, newest first (used by History page + Dashboard RecentRecipes)
export async function getAllRecipes(uid) {
  const q = query(recipesRef(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteRecipe(uid, recipeId) {
  return deleteDoc(doc(db, 'users', uid, 'recipes', recipeId));
}
