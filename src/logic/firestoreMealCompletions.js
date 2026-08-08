// src/logic/firestoreMealCompletions.js
//
// Durable record of "user marked this plan-day done," written just BEFORE
// MealPlanner.jsx's commitRemoval() splices the day out of the plan.
// Without this, completion is destructive — the day just vanishes from
// plan.days with no trace — which is why AchievedGoalsCard's streakDays/
// todayPct have had nothing to read from until now.
//
// Schema: users/{uid}/mealCompletions/{dateKey}
//   dateKey: 'YYYY-MM-DD'    // also the doc ID, one doc per calendar day
//   dayName: string          // e.g. 'Monday' — the plan's day.day label, for reference
//   completedAt: serverTimestamp()
//
// One doc per DATE (not per plan-day-name), so if a user somehow completes
// two different plans' "Monday" on two different calendar weeks, they don't
// collide — streaks are inherently calendar-based, not plan-based.
//
// Suggested Firestore rule (same pattern as reviews/tasks/logs):
//   match /users/{uid}/mealCompletions/{dateKey} {
//     allow read, write: if request.auth != null && request.auth.uid == uid;
//   }

import { db } from '../firebase';
import { doc, setDoc, getDocs, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { toDateKey } from './firestoreLogs';

const completionsRef = (uid) => collection(db, 'users', uid, 'mealCompletions');

// Idempotent — setDoc on a fixed dateKey ID, so calling this twice for the
// same day (e.g. a retry) just overwrites, never duplicates.
export async function recordDayCompletion(uid, dayName, date = toDateKey()) {
  if (!uid) throw new Error('recordDayCompletion: uid required');
  await setDoc(doc(db, 'users', uid, 'mealCompletions', date), {
    dateKey: date,
    dayName,
    completedAt: serverTimestamp(),
  });
}

export async function getAllCompletions(uid) {
  const q = query(completionsRef(uid), orderBy('dateKey', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Consecutive-day streak counting BACKWARD from today. Stops at the first
// gap. If today itself has no completion yet, that's fine — the streak is
// still whatever run of PRIOR consecutive days exists; it just doesn't
// count today until the user completes something today.
export function calculateStreak(completions) {
  const dateKeys = new Set(completions.map((c) => c.dateKey));
  let streak = 0;
  const cursor = new Date();

  // If today isn't completed yet, start counting from yesterday instead —
  // otherwise an unbroken streak through yesterday would incorrectly show
  // as 0 just because today isn't done yet.
  if (!dateKeys.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dateKeys.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function wasCompletedToday(completions, date = toDateKey()) {
  return completions.some((c) => c.dateKey === date);
}
