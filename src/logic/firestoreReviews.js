// src/logic/firestoreReviews.js
//
// Reviews live under users/{uid}/reviews/{reviewId} — same subcollection
// pattern as goals/{goalId} and logs/{logId}. See
// NutriSense_Firestore_Reviews_Schema.md for the full schema writeup and
// security rules.

import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Adds a new review under users/{uid}/reviews.
 * @param {string} uid
 * @param {{ rating: number, review?: string }} data
 * @returns {Promise<string>} new document ID
 */
export async function addReview(uid, { rating, review = '' }) {
  if (!uid) throw new Error('addReview: uid is required');
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('addReview: rating must be between 1 and 5');
  }

  const ref = collection(db, 'users', uid, 'reviews');
  const docRef = await addDoc(ref, {
    rating,
    review,
    createdAt: serverTimestamp(),
    appVersion: '1.0.0',
  });
  return docRef.id;
}

/**
 * Fetches all reviews for a user, most recent first.
 * @param {string} uid
 * @returns {Promise<Array<{id: string, rating: number, review: string, createdAt: Date|null}>>}
 */
export async function getUserReviews(uid) {
  if (!uid) throw new Error('getUserReviews: uid is required');

  const ref = collection(db, 'users', uid, 'reviews');
  const q = query(ref, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      rating: data.rating,
      review: data.review ?? '',
      // Firestore Timestamp -> Date, per project's known gotcha
      // (Timestamp can't be passed directly to `new Date()`).
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
    };
  });
}
