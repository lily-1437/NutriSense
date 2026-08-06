// src/logic/firestoreMealPlans.js
// One active meal plan per user: users/{uid}/mealPlans/current
// Stores the selected template + merged AI coach content together so we
// don't need a join on read.

import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const planRef = (uid) => doc(db, 'users', uid, 'mealPlans', 'current');

// generatedAt is owned by the CALLER, not this function — it must be set
// once at plan creation (see MealPlanner.jsx's handleGenerate) and preserved
// unchanged on every subsequent save (day completions, undos, etc.). Every
// day's displayed date is derived from this single value, so overwriting it
// on every write here would silently shift the whole week forward each time
// a day is marked done.
export async function saveMealPlan(uid, planData) {
  if (!uid) throw new Error('saveMealPlan: uid required');
  await setDoc(planRef(uid), planData);
}

export async function getMealPlan(uid) {
  if (!uid) throw new Error('getMealPlan: uid required');
  const snap = await getDoc(planRef(uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function deleteMealPlan(uid) {
  if (!uid) throw new Error('deleteMealPlan: uid required');
  await deleteDoc(planRef(uid));
}
