/**
 * Firebase Admin SDK Initialization
 *
 * Used server-side to verify Firebase ID tokens from the frontend.
 * In production (Cloud Run), uses GOOGLE_APPLICATION_CREDENTIALS or
 * Application Default Credentials. Locally, uses gcloud CLI auth.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let app: App;
let adminAuth: Auth;

function initFirebaseAdmin(): void {
  if (getApps().length > 0) {
    app = getApps()[0];
    adminAuth = getAuth(app);
    return;
  }

  const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;

  if (credentialsJson) {
    // Production: use service account JSON from environment variable
    const serviceAccount = JSON.parse(credentialsJson);
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // Local development: use Application Default Credentials (gcloud CLI)
    app = initializeApp();
  }

  adminAuth = getAuth(app);
}

initFirebaseAdmin();

export { adminAuth };
