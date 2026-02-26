/**
 * Firestore Client
 *
 * Initializes Firebase Firestore using the existing Firebase app instance.
 * Call getFirestoreDb() to get the Firestore instance anywhere in the app.
 *
 * Collections:
 *  - grafana_contributors: Grafana dashboard profiles, keyed by user uid
 *
 * Security Rules (set in Firebase Console):
 *  Allow read if authenticated @8020rei.com user.
 *  Allow write only to own document (uid must match doc ID).
 */

import { getFirestore as _getFirestore, Firestore } from 'firebase/firestore';
import { app } from './config';

let _db: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (!_db) {
    _db = _getFirestore(app);
  }
  return _db;
}

// Re-export Firestore helpers so consumers import from one place
export {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

export type { Timestamp } from 'firebase/firestore';
