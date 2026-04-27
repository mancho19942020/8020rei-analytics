/**
 * Firebase Admin SDK — Server-Side Only
 *
 * Used in Next.js API routes to verify Firebase ID tokens.
 * This file must NEVER be imported from client components.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth';
import { headers } from 'next/headers';

const ALLOWED_DOMAIN = '8020rei.com';

let app: App | null = null;
let adminAuth: Auth;

/**
 * Returns the shared Firebase Admin app, initializing it on first call.
 * Used by both auth and Firestore helpers so a single app instance is reused.
 */
export function getAdminApp(): App {
  if (app) return app;

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;

  if (credentialsJson) {
    const serviceAccount = JSON.parse(credentialsJson);
    app = initializeApp({ credential: cert(serviceAccount) });
  } else {
    // Local dev: uses Application Default Credentials (gcloud CLI).
    // Firestore emulator auto-detected via FIRESTORE_EMULATOR_HOST env var.
    // Pin the project so ADC doesn't fall back to whatever `gcloud config`
    // points at (which is often a different GCP project) — that mismatch
    // was producing misleading "Firestore API has not been used in project
    // <gcloud-default>" errors during local feedback testing.
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    app = initializeApp(projectId ? { projectId } : undefined);
  }

  return app;
}

function getAdminAuth(): Auth {
  if (adminAuth) return adminAuth;
  adminAuth = getAuth(getAdminApp());
  return adminAuth;
}

export interface AuthResult {
  authenticated: boolean;
  user?: { uid: string; email: string; name?: string };
  error?: string;
  status?: number;
}

/**
 * Verify the Firebase ID token from the request Authorization header.
 * Returns the decoded user or an error.
 */
export async function verifyRequest(): Promise<AuthResult> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      authenticated: false,
      error: 'Missing or invalid Authorization header',
      status: 401,
    };
  }

  const token = authHeader.slice(7);

  try {
    const decoded: DecodedIdToken = await getAdminAuth().verifyIdToken(token);

    const email = decoded.email || '';
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return {
        authenticated: false,
        error: 'Access denied. Only @8020rei.com accounts are allowed.',
        status: 403,
      };
    }

    return {
      authenticated: true,
      user: {
        uid: decoded.uid,
        email: decoded.email || '',
        name: decoded.name,
      },
    };
  } catch (error: any) {
    const message =
      error.code === 'auth/id-token-expired'
        ? 'Token expired. Please refresh and try again.'
        : 'Invalid authentication token';

    return { authenticated: false, error: message, status: 401 };
  }
}
