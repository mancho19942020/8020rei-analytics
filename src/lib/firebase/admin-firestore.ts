/**
 * Firebase Admin Firestore — Server-Side Only
 *
 * Thin wrapper over `firebase-admin/firestore`. Reuses the shared Admin app
 * from `admin.ts`.
 *
 * Never import from client components. For the user-side Firestore client
 * used in browser contexts, see `src/lib/firebase/firestore.ts`.
 *
 * Emulator support: if `FIRESTORE_EMULATOR_HOST` is set (e.g. `localhost:8080`),
 * the Admin SDK auto-connects to the emulator instead of production. This is
 * what enables safe local testing of the reconciler before it touches the
 * real `pcm_alignment_runs` collection.
 */

import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAdminApp } from './admin';

let _db: Firestore | null = null;

export function getAdminFirestore(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getAdminApp());
  return _db;
}

export const PCM_ALIGNMENT_COLLECTION = 'pcm_alignment_runs';
