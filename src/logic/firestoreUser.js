// src/logic/firestoreUser.js
//
// Reads/writes fields on the users/{uid} document itself (as opposed to its
// goals/logs/recipes subcollections): conditions[] and the profile detail
// fields shown on the Profile Settings page.
//
// Fields on users/{uid}:
//   conditions: string[]
//   fullName: string
//   heightCm: string
//   weightKg: string
//   age: string
//   gender: 'Male' | 'Female' | 'Prefer not to say'
//   bio: string (optional)
//   exercisesRegularly: boolean
//   exerciseFrequency: '1-2' | '3-4' | '5-6' | 'daily' | null
//     (null/absent when exercisesRegularly is false)

import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

export async function getUserConditions(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return [];
  return snap.data().conditions ?? [];
}

// Uses { merge: true } so this never clobbers other fields on the user doc
// (email, displayName, createdAt, etc.) -- only touches `conditions`.
export async function updateUserConditions(uid, conditions) {
  await setDoc(doc(db, 'users', uid), { conditions }, { merge: true });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    fullName: data.fullName ?? '',
    heightCm: data.heightCm ?? '',
    weightKg: data.weightKg ?? '',
    age: data.age ?? '',
    gender: data.gender ?? '',
    bio: data.bio ?? '',
    exercisesRegularly: data.exercisesRegularly ?? false,
    exerciseFrequency: data.exerciseFrequency ?? null,
  };
}

// Same { merge: true } pattern -- only touches these profile fields.
export async function updateUserProfile(
  uid,
  { fullName, heightCm, weightKg, age, gender, bio, exercisesRegularly, exerciseFrequency }
) {
  await setDoc(
    doc(db, 'users', uid),
    {
      fullName,
      heightCm,
      weightKg,
      age,
      gender,
      bio,
      exercisesRegularly,
      // Don't persist a stale frequency if the user toggled activity off.
      exerciseFrequency: exercisesRegularly ? exerciseFrequency : null,
    },
    { merge: true }
  );
}

// -----------------------------------------------------------------------
// Full account data wipe -- used by Profile.jsx's "Delete Account" flow.
//
// Deletes ALL of a user's data across every subcollection under
// users/{uid}, plus the user doc itself (profile fields + conditions).
// Must be called BEFORE deleteUser(auth.currentUser) in the deletion flow
// -- once the Firebase Auth user is gone, Firestore security rules (which
// check request.auth.uid == uid) will reject these deletes.
//
// SUBCOLLECTION LIST -- must stay in sync with every users/{uid}/* path
// used anywhere in src/logic/. Whenever a new subcollection is added,
// add it here too, or accounts will leave orphaned data behind on
// deletion. Current subcollections, one per source file:
//   goals            (firestoreGoals.js)
//   recipes          (firestoreRecipes.js)
//   mealPlans/current (firestoreMealPlans.js — single fixed-id doc, not a
//                       collection to enumerate, so it's deleted directly)
//   reviews          (firestoreReviews.js)
//   tasks            (firestoreTasks.js)
//   logs             (firestoreLogs.js)
//   mealCompletions  (firestoreMealCompletions.js)
//
// FIX: reviews, tasks, logs, and mealCompletions were all added after this
// function was first written and never retrofitted in -- deleting an
// account previously left those four subcollections orphaned in
// Firestore forever (no Auth user left to ever satisfy the security rule
// that would let anyone clean them up afterward). All seven are now
// covered.
//
// Uses a single atomic writeBatch: either everything is deleted or nothing
// is, so an account is never left in a half-deleted state.
//
// NOTE: writeBatch caps at 500 operations. If a user could plausibly have
// 500+ combined documents across all subcollections, this needs chunking
// -- not implemented here since that's far beyond this app's current scale.
// -----------------------------------------------------------------------
export async function deleteUserAccountData(uid) {
  if (!uid) throw new Error('deleteUserAccountData: uid required');

  const batch = writeBatch(db);

  // Subcollections that need every doc enumerated + deleted individually.
  const collectionsToWipe = ['goals', 'recipes', 'reviews', 'tasks', 'logs', 'mealCompletions'];
  for (const name of collectionsToWipe) {
    const snap = await getDocs(collection(db, 'users', uid, name));
    snap.forEach((d) => batch.delete(d.ref));
  }

  // Meal plan: single doc at users/{uid}/mealPlans/current -- fixed ID,
  // no enumeration needed.
  batch.delete(doc(db, 'users', uid, 'mealPlans', 'current'));

  // The user doc itself: profile fields + conditions
  batch.delete(doc(db, 'users', uid));

  await batch.commit();
}