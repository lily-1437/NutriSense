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
import { doc, getDoc, setDoc } from 'firebase/firestore';

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