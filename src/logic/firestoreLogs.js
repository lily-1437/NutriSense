// src/logic/firestoreLogs.js
//
// Actual logged intake — distinct from firestoreRecipes.js (which stores
// analysis *events*, not "user ate X on date Y") and from mealPlanNutrition.js
// (which sums *planned/estimated* macros, not what was actually eaten).
//
// Schema: users/{uid}/logs/{logId}
//   date: 'YYYY-MM-DD'              // local date string, NOT a Firestore Timestamp —
//                                    // lets us do a simple where('date','==',...) /
//                                    // where('date','>=',...) range query without
//                                    // timezone-conversion headaches at query time.
//   mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
//   calories: number
//   protein: number
//   carbs: number
//   fat: number
//   sourceRecipeId: string | null    // optional link back to users/{uid}/recipes/{id}
//                                    // when a log entry was created "from" a saved analysis
//   note: string                    // optional freeform label, e.g. "Chicken salad"
//   createdAt: serverTimestamp()
//
// Suggested Firestore rule (same pattern as reviews/tasks):
//   match /users/{uid}/logs/{logId} {
//     allow read, write: if request.auth != null && request.auth.uid == uid;
//   }

import { db } from '../firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

const logsRef = (uid) => collection(db, 'users', uid, 'logs');

// 'YYYY-MM-DD' in the user's LOCAL time (not UTC) — matters because
// toISOString() shifts to UTC and can silently roll the date over near
// midnight. All date math in this file goes through this helper so
// "today" always means the same thing everywhere it's used.
export function toDateKey(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Returns the last `days` date keys, oldest first, ending at today.
// e.g. getLastNDateKeys(7) -> ['2026-08-02', ..., '2026-08-08']
export function getLastNDateKeys(days = 7) {
  const keys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}

export async function addLog(uid, {
  date = toDateKey(),
  mealType,
  calories = 0,
  protein = 0,
  carbs = 0,
  fat = 0,
  sourceRecipeId = null,
  note = '',
}) {
  if (!uid) throw new Error('addLog: uid required');
  if (!mealType) throw new Error('addLog: mealType required');

  const docRef = await addDoc(logsRef(uid), {
    date, mealType, calories, protein, carbs, fat, sourceRecipeId, note,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateLog(uid, logId, changes) {
  return updateDoc(doc(db, 'users', uid, 'logs', logId), changes);
}

export async function deleteLog(uid, logId) {
  return deleteDoc(doc(db, 'users', uid, 'logs', logId));
}

// All log entries for one exact date (e.g. today).
export async function getLogsForDate(uid, date = toDateKey()) {
  const q = query(logsRef(uid), where('date', '==', date));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// All log entries between two date keys, inclusive. Used for the week view.
// NOTE: requires no composite index since it's a single-field range query.
export async function getLogsForRange(uid, startDate, endDate) {
  const q = query(
    logsRef(uid),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* -------------------- Aggregation helpers -------------------- */
// These turn raw log rows into exactly the shapes AnalyticsCards.jsx
// expects, so Dashboard.jsx can call them directly and pass the result
// straight into <TodaysIntakeCard data={...} /> etc.

// targets = { calories, carbs, protein, fat } — pull from the user's
// active goal (firestoreGoals.js) or the current meal plan's planned
// totals (mealPlanNutrition.sumDayNutrition); this module doesn't decide
// that, it just needs the numbers handed in.
export function aggregateTodaysIntake(logs, targets) {
  const sums = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      carbs: acc.carbs + (log.carbs || 0),
      protein: acc.protein + (log.protein || 0),
      fat: acc.fat + (log.fat || 0),
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 },
  );

  return {
    calories: { consumed: sums.calories, target: targets?.calories ?? 2000 },
    carbs: { consumed: sums.carbs, target: targets?.carbs ?? 250 },
    protein: { consumed: sums.protein, target: targets?.protein ?? 100 },
    fat: { consumed: sums.fat, target: targets?.fat ?? 65 },
  };
}

// logs = flat array across the range (from getLogsForRange), dateKeys =
// the ordered list of days to show (from getLastNDateKeys). Days with no
// logs still appear, at 0 calories, so the chart doesn't silently skip them.
export function aggregateWeekIntake(logs, dateKeys) {
  const byDate = new Map(dateKeys.map((k) => [k, 0]));
  for (const log of logs) {
    if (byDate.has(log.date)) {
      byDate.set(log.date, byDate.get(log.date) + (log.calories || 0));
    }
  }

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return dateKeys.map((dateKey) => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dayLabel = DAY_LABELS[new Date(y, m - 1, d).getDay()];
    return { day: dayLabel, calories: byDate.get(dateKey) };
  });
}
