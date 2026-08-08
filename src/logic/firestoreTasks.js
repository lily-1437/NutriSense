import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * firestoreTasks.js
 * ----------------------------------------------------------------------
 * Optional Firestore wiring for TodaysTask.jsx, in the same shape as
 * firestoreGoals.js / firestoreRecipes.js / firestoreReviews.js.
 *
 * Schema: users/{uid}/tasks/{taskId}
 *   title: string
 *   description: string
 *   date: string            // display date, e.g. "Today" or "2026-08-08"
 *   time: string             // display time range
 *   status: 'open' | 'completed' | 'archived'
 *   priority: 'Low' | 'Medium' | 'High'
 *   context: string          // e.g. 'Health Goal', 'Recipe Analysis'
 *   createdAt: serverTimestamp()
 *   updatedAt: serverTimestamp()
 *
 * Not wired into the page by default — TodaysTask.jsx ships with local
 * mock state so it renders standalone. Swap the useState(initialTasks)
 * block for getAllTasks(user.uid) + these mutators when ready.
 */

const tasksRef = (uid) => collection(db, 'users', uid, 'tasks');

export async function getAllTasks(uid) {
  const q = query(tasksRef(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createTask(uid, task) {
  const docRef = await addDoc(tasksRef(uid), {
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTaskStatus(uid, taskId, status) {
  const ref = doc(db, 'users', uid, 'tasks', taskId);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}

export async function updateTask(uid, taskId, fields) {
  const ref = doc(db, 'users', uid, 'tasks', taskId);
  await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() });
}

export async function deleteTask(uid, taskId) {
  const ref = doc(db, 'users', uid, 'tasks', taskId);
  await deleteDoc(ref);
}

/**
 * Suggested Firestore rules addition (mirrors the reviews subcollection
 * pattern already deployed):
 *
 * match /users/{uid}/tasks/{taskId} {
 *   allow read, write: if request.auth != null && request.auth.uid == uid;
 * }
 */
