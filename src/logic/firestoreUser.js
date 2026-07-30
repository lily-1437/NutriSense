// src/logic/firestoreUser.js
//
// Reads/writes fields on the users/{uid} document itself (as opposed to its
// goals/logs/recipes subcollections). Currently just conditions[], since
// that's the only top-level user field any UI needs to edit directly.

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
