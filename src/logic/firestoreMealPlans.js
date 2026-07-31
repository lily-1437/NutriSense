// src/logic/firestoreMealPlans.js
// One active meal plan per user: users/{uid}/mealPlans/current
// Stores the selected template + merged AI coach content together so we
// don't need a join on read.

import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const planRef = (uid) => doc(db, 'users', uid, 'mealPlans', 'current');

export async function saveMealPlan(uid, planData) {
  if (!uid) throw new Error('saveMealPlan: uid required');
  await setDoc(planRef(uid), {
    ...planData,
    generatedAt: serverTimestamp(),
  });
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