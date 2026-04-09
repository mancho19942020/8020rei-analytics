/**
 * Authentication Middleware
 *
 * Fastify preHandler hook that verifies Firebase ID tokens.
 * Rejects requests without a valid token with 401.
 * Also enforces the @8020rei.com email domain restriction.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { adminAuth } from './firebase-admin.js';

const ALLOWED_DOMAIN = '8020rei.com';

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({
      success: false,
      error: 'Missing or invalid Authorization header',
    });
    return;
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    // Enforce company email domain
    const email = decoded.email || '';
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      reply.status(403).send({
        success: false,
        error: 'Access denied. Only @8020rei.com accounts are allowed.',
      });
      return;
    }

    // Attach user info to request for downstream use
    (request as any).firebaseUser = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };
  } catch (error: any) {
    const message =
      error.code === 'auth/id-token-expired'
        ? 'Token expired. Please refresh and try again.'
        : 'Invalid authentication token';

    reply.status(401).send({
      success: false,
      error: message,
    });
  }
}
