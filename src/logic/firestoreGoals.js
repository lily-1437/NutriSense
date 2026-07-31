// src/logic/firestoreGoals.js
import { db } from '../firebase';
import {
  collection, doc, getDocs, query, where, addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';

const goalsRef = (uid) => collection(db, 'users', uid, 'goals');

export async function createGoal(uid, {
  targetCalories, targetProtein, targetFat, targetCarbs, timeframe,
  sourceText = null, rationale = null, conditionsConsidered = [],
}) {
  return addDoc(goalsRef(uid), {
    targetCalories, targetProtein, targetFat, targetCarbs, timeframe,
    sourceText, rationale, conditionsConsidered,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getAllGoals(uid) {
  const snap = await getDocs(goalsRef(uid));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Server-side filtered — cheaper than pulling every goal a user has ever
// created just to find the current one. Used by MealPlanner so the AI coach
// personalizes against the user's CURRENT goal, not a stale/completed one.
export async function getActiveGoals(uid) {
  const q = query(goalsRef(uid), where('status', '==', 'active'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateGoal(uid, goalId, changes) {
  return updateDoc(doc(db, 'users', uid, 'goals', goalId), { ...changes, updatedAt: serverTimestamp() });
}

export async function deleteGoal(uid, goalId) {
  return deleteDoc(doc(db, 'users', uid, 'goals', goalId));
}