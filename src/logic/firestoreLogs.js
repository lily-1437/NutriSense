// src/logic/firestoreLogs.js
import { db } from '../firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, deleteDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';

const logsRef = (uid) => collection(db, 'users', uid, 'logs');

// Save a finished analysis (called from Stage 3 "Save to History")
export async function saveLog(uid, { recipeName, rawInput, ingredients, totals, perServing, servings }) {
  return addDoc(logsRef(uid), {
    recipeName, rawInput, ingredients, totals, perServing, servings,
    createdAt: serverTimestamp(),
    riskFlags: [], // populated in Increment 3
  });
}

// Fetch one log (used by /history/:recipeId to hydrate Stage 3)
export async function getLog(uid, logId) {
  const snap = await getDoc(doc(db, 'users', uid, 'logs', logId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Fetch all logs, newest first (used by History page + Dashboard RecentRecipes)
export async function getAllLogs(uid) {
  const q = query(logsRef(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteLog(uid, logId) {
  return deleteDoc(doc(db, 'users', uid, 'logs', logId));
}