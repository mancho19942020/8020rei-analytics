/**
 * Firestore I/O for the PCM Alignment audit log.
 *
 * Collection: `pcm_alignment_runs` (append-only).
 * Schema: see `src/types/pcm-alignment.ts` + personal-documents/8020-metrics-hub/2026-04-22/phase-2-schema.md.
 *
 * Writes go through `writeAlignmentDocs()` — batched, up to 500 per batch
 * (Firestore's limit). Reads go through `getLatestForWidget()` which returns
 * the most recent doc per (sub_key × campaign_type) for a given widget_key.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore, PCM_ALIGNMENT_COLLECTION } from '../firebase/admin-firestore';
import type {
  AlignmentDoc,
  AlignmentSubMetric,
  WidgetAlignmentPayload,
} from '@/types/pcm-alignment';

/**
 * Build the canonical document id from its fields. Keeps docs sortable and
 * prevents duplicates on retries (Firestore `set` with same id is idempotent).
 */
export function buildDocId(
  run_id: string,
  widget_key: string,
  sub_key: string | null,
  campaign_type: string,
): string {
  const parts = [run_id, widget_key];
  if (sub_key) parts.push(sub_key);
  parts.push(campaign_type);
  return parts.join('__');
}

/**
 * Batched write. `docs` can be larger than 500 — split into multiple batches.
 * Returns the number of docs actually written.
 */
export async function writeAlignmentDocs(docs: AlignmentDoc[]): Promise<number> {
  if (docs.length === 0) return 0;

  const db = getAdminFirestore();
  const col = db.collection(PCM_ALIGNMENT_COLLECTION);
  const BATCH_LIMIT = 500;
  let written = 0;

  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const slice = docs.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();

    for (const doc of slice) {
      const id = buildDocId(doc.run_id, doc.widget_key, doc.sub_key, doc.campaign_type);
      batch.set(col.doc(id), {
        ...doc,
        // Use server timestamp so cross-instance clock drift never pollutes
        // the "reconciled N min ago" footer. The `computed_at` ISO string in
        // the doc is the client-side reference; the server timestamp is the
        // authoritative ordering key.
        server_computed_at: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    written += slice.length;
  }

  return written;
}

/**
 * Read the latest doc per (sub_key × campaign_type) for a widget_key.
 * Used by GET /api/pcm-alignment/latest — the read path the widget chrome
 * (Phase 4) calls to render its freshness footer + drift icon.
 */
export async function getLatestForWidget(widget_key: string): Promise<WidgetAlignmentPayload> {
  const db = getAdminFirestore();
  const col = db.collection(PCM_ALIGNMENT_COLLECTION);

  // Most-recent-first; take a generous top-N to cover all sub_keys × types
  // a single widget can emit. A headline with 4 sub_keys × 3 types = 12 docs
  // per run; we read ~50 to reliably get the latest of each combo.
  const snapshot = await col
    .where('widget_key', '==', widget_key)
    .orderBy('server_computed_at', 'desc')
    .limit(50)
    .get();

  const sub_metrics: Record<string, AlignmentSubMetric> = {};
  let last_computed_at: string | null = null;

  for (const d of snapshot.docs) {
    const doc = d.data() as AlignmentDoc;
    const subKey = doc.sub_key ?? '_root';
    if (!sub_metrics[subKey]) {
      sub_metrics[subKey] = { total: null, rr: null, smartdrop: null };
    }
    // Only fill if not already filled (first match wins — which is the newest
    // because the query is ordered desc).
    const bucket = sub_metrics[subKey];
    if (!bucket[doc.campaign_type]) {
      bucket[doc.campaign_type] = doc;
      if (!last_computed_at || doc.computed_at > last_computed_at) {
        last_computed_at = doc.computed_at;
      }
    }
  }

  return {
    widget_key,
    last_computed_at,
    sub_metrics,
  };
}

/**
 * Count the most-recent-run docs per severity, for observability / Slack digest.
 * Returns the severity counts for docs whose server_computed_at is within the
 * given lookback window.
 */
export async function countSeveritiesSince(sinceISO: string): Promise<Record<string, number>> {
  const db = getAdminFirestore();
  const col = db.collection(PCM_ALIGNMENT_COLLECTION);

  const snapshot = await col
    .where('computed_at', '>=', sinceISO)
    .select('severity')
    .get();

  const counts: Record<string, number> = { green: 0, yellow: 0, red: 0, info: 0 };
  for (const d of snapshot.docs) {
    const s = (d.data() as { severity?: string }).severity;
    if (s && s in counts) counts[s]++;
  }
  return counts;
}

/**
 * Returns a map of the PREVIOUS severity per (widget_key × sub_key × campaign_type)
 * key, looking at docs with computed_at strictly before `beforeISO`. Used by the
 * reconciler's Phase 6 tier-transition detector: compare current vs previous to
 * decide when to fire a Slack alert (only on entering-red / leaving-red).
 *
 * Returns empty map on the very first run (no prior docs exist).
 */
export async function getPreviousSeverityMap(
  beforeISO: string,
): Promise<Map<string, AlignmentDoc>> {
  const db = getAdminFirestore();
  const col = db.collection(PCM_ALIGNMENT_COLLECTION);

  // Pull up to 500 most-recent docs before `beforeISO`. At ~30 docs per run,
  // 500 covers the last ~16 runs — way more than we need to find the latest
  // per combo. A composite index on (computed_at desc) covers this scan.
  const snapshot = await col
    .where('computed_at', '<', beforeISO)
    .orderBy('computed_at', 'desc')
    .limit(500)
    .get();

  const map = new Map<string, AlignmentDoc>();
  for (const d of snapshot.docs) {
    const doc = d.data() as AlignmentDoc;
    const key = transitionKey(doc.widget_key, doc.sub_key, doc.campaign_type);
    if (!map.has(key)) {
      // First hit wins — query is desc, so this is the most recent before `beforeISO`.
      map.set(key, doc);
    }
  }
  return map;
}

/** Stable key used by the transition detector. */
export function transitionKey(widget_key: string, sub_key: string | null, campaign_type: string): string {
  return `${widget_key}::${sub_key ?? ''}::${campaign_type}`;
}
