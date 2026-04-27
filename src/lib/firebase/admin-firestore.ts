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
  // Without this, every Firestore .set / batch containing an `undefined`
  // field throws "Cannot use 'undefined' as a Firestore value" and aborts
  // the entire batch. The PCM alignment reconciler emits AlignmentDoc.notes
  // entries whose optional fields can be undefined depending on the contract;
  // historically that sank docs_written to 0 across every cron run, leaving
  // widget chrome stuck on "Awaiting reconcile". Treat undefined as "skip
  // this field" — matches the Firestore client-SDK default semantics.
  //
  // settings() can only be called once per Firestore instance. Under Next.js
  // dev HMR our `_db` cache resets while the underlying Admin SDK keeps the
  // same Firestore instance — guard so the second call doesn't throw.
  try {
    _db.settings({ ignoreUndefinedProperties: true });
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes('already been initialized')) {
      throw err;
    }
  }
  return _db;
}

export const PCM_ALIGNMENT_COLLECTION = 'pcm_alignment_runs';
