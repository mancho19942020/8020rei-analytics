/**
 * PATCH /api/feedback/[id] — admin-only update (status / priority / adminResponse / description).
 * DELETE /api/feedback/[id] — admin-only hard delete.
 *
 * Status transitions are validated against the state machine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin-firestore';
import { FEEDBACK_COLLECTION } from '@/lib/firebase/feedback-collection';
import { canAccessFeedbackBoard } from '@/lib/access';
import { resolveUser } from '@/lib/feedback/server-auth';
import {
  isFeedbackPriority,
  isFeedbackStatus,
  isValidTransition,
} from '@/lib/feedback/types';

interface PatchBody {
  status?: unknown;
  priority?: unknown;
  adminResponse?: unknown;
  description?: unknown;
}

async function requireAdmin(
  request: NextRequest
): Promise<
  | { ok: true; email: string }
  | { ok: false; response: NextResponse }
> {
  const auth = await resolveUser(request);
  if (!auth.ok) return auth;
  if (!canAccessFeedbackBoard(auth.user.email)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      ),
    };
  }
  return { ok: true, email: auth.user.email };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Missing id' },
      { status: 400 }
    );
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const db = getAdminFirestore();
  const ref = db.collection(FEEDBACK_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json(
      { success: false, error: 'Feedback item not found' },
      { status: 404 }
    );
  }

  const current = snap.data() ?? {};
  const update: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!isFeedbackStatus(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }
    const fromStatus = isFeedbackStatus(current.status) ? current.status : 'pending';
    if (!isValidTransition(fromStatus, body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid transition from ${fromStatus} to ${body.status}`,
        },
        { status: 400 }
      );
    }
    update.status = body.status;
  }

  if (body.priority !== undefined) {
    if (!isFeedbackPriority(body.priority)) {
      return NextResponse.json(
        { success: false, error: 'Invalid priority value' },
        { status: 400 }
      );
    }
    update.priority = body.priority;
  }

  if (body.adminResponse !== undefined) {
    if (body.adminResponse !== null && typeof body.adminResponse !== 'string') {
      return NextResponse.json(
        { success: false, error: 'adminResponse must be a string or null' },
        { status: 400 }
      );
    }
    update.adminResponse = body.adminResponse;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || body.description.trim().length < 1) {
      return NextResponse.json(
        { success: false, error: 'description must be a non-empty string' },
        { status: 400 }
      );
    }
    update.description = body.description;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { success: false, error: 'No fields to update' },
      { status: 400 }
    );
  }

  update.updatedAt = FieldValue.serverTimestamp();
  await ref.update(update);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Missing id' },
      { status: 400 }
    );
  }

  const db = getAdminFirestore();
  await db.collection(FEEDBACK_COLLECTION).doc(id).delete();
  return NextResponse.json({ success: true });
}
