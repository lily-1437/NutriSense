// src/logic/firestoreGoals.js
import { db } from '../firebase';
import {
  collection, doc, getDocs, query, where, addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';

const goalsRef = (uid) => collection(db, 'users', uid, 'goals');

export async function createGoal(uid, {
  targetName, startDate = null, endDate = null, description = null,
  milestones = [], templateKey = null, sourceText = null, rationale = null, conditionsConsidered = [],
  // Legacy macro fields kept optional so any old-shape callers don't break.
  targetCalories = null, targetProtein = null, targetFat = null, targetCarbs = null, timeframe = null,
}) {
  return addDoc(goalsRef(uid), {
    targetName, startDate, endDate, description, milestones, templateKey,
    sourceText, rationale, conditionsConsidered,
    targetCalories, targetProtein, targetFat, targetCarbs, timeframe,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Toggle helpers — thin wrappers over updateGoal so callers (GoalCard) read
// clearly and the animation trigger (status flip) is a single call.
export async function markGoalComplete(uid, goalId) {
  return updateGoal(uid, goalId, { status: 'completed' });
}
export async function markGoalActive(uid, goalId) {
  return updateGoal(uid, goalId, { status: 'active' });
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