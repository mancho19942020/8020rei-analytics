/**
 * POST /api/feedback — create a feedback item.
 *
 * Auth: any signed-in @8020rei.com user (per `verifyRequest`).
 * Storage: Firestore `feedback_items` collection (Admin SDK).
 *
 * Body shape mirrors the spec at `personal-documents/Feedback Tool/02-data-model.md`.
 *
 * GET /api/feedback — list feedback items (admin-only).
 * Returned for non-realtime fallback consumers (e.g. server components, tests).
 * The admin board itself uses client-side onSnapshot.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin-firestore';
import { FEEDBACK_COLLECTION } from '@/lib/firebase/feedback-collection';
import { canAccessFeedbackBoard } from '@/lib/access';
import { resolveUser } from '@/lib/feedback/server-auth';

// Server enforces a smaller floor than the client (which validates user
// text only). The full description carries the [TYPE] prefix and the AI
// context block, so the total payload is always significantly longer.
const MIN_DESCRIPTION_LENGTH = 15;

interface CreateFeedbackBody {
  description?: string;
  componentContext?: unknown;
  deviceContext?: unknown;
  environmentContext?: unknown;
}

export async function POST(request: NextRequest) {
  const auth = await resolveUser(request);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  let body: CreateFeedbackBody;
  try {
    body = (await request.json()) as CreateFeedbackBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { description, componentContext, deviceContext, environmentContext } = body;

  if (typeof description !== 'string' || description.trim().length < MIN_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        error: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`,
      },
      { status: 400 }
    );
  }

  if (!componentContext || typeof componentContext !== 'object') {
    return NextResponse.json(
      { success: false, error: 'Missing componentContext' },
      { status: 400 }
    );
  }

  try {
    const db = getAdminFirestore();
    const docRef = db.collection(FEEDBACK_COLLECTION).doc();
    const now = FieldValue.serverTimestamp();

    await docRef.set({
      authorUid: user.uid,
      authorName: user.name ?? user.email.split('@')[0],
      authorEmail: user.email,
      status: 'pending',
      priority: 'medium',
      description,
      componentContext,
      deviceContext: deviceContext ?? null,
      environmentContext: environmentContext ?? null,
      adminResponse: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error('[/api/feedback POST] Firestore error:', err);
    const message = err instanceof Error ? err.message : 'Unknown Firestore error';
    return NextResponse.json(
      {
        success: false,
        error: `Could not save feedback. ${message}`,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await resolveUser(request);
  if (!auth.ok) return auth.response;
  if (!canAccessFeedbackBoard(auth.user.email)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const db = getAdminFirestore();
    const snap = await db
      .collection(FEEDBACK_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    const items = snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toMillis
        ? { seconds: Math.floor(data.createdAt.toMillis() / 1000), nanoseconds: 0 }
        : data.createdAt ?? null;
      const updatedAt = data.updatedAt?.toMillis
        ? { seconds: Math.floor(data.updatedAt.toMillis() / 1000), nanoseconds: 0 }
        : data.updatedAt ?? null;
      return { id: d.id, ...data, createdAt, updatedAt };
    });
    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error('[/api/feedback GET] Firestore error:', err);
    const message = err instanceof Error ? err.message : 'Unknown Firestore error';
    return NextResponse.json(
      {
        success: false,
        error: `Could not read feedback. ${message}`,
      },
      { status: 500 }
    );
  }
}
