/**
 * PostcardMania API Client for Next.js API Routes — READ-ONLY
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CRITICAL: READ-ONLY — NO EXCEPTIONS                        ║
 * ║  Only GET requests allowed (except POST /auth/login).        ║
 * ║  Direct instruction from Camilo (CEO).                       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const PCM_BASE_URL = 'https://v3.pcmintegrations.com';
const TOKEN_CACHE_DURATION_MS = 55 * 60 * 1000;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function authenticate(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const apiKey = process.env.PCM_API_KEY;
  const apiSecret = process.env.PCM_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('PCM API credentials not configured');
  }

  const response = await fetch(`${PCM_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, apiSecret }),
  });

  if (!response.ok) {
    throw new Error(`PCM auth failed (${response.status})`);
  }

  const data = await response.json() as { token: string };
  cachedToken = { token: data.token, expiresAt: Date.now() + TOKEN_CACHE_DURATION_MS };
  return cachedToken.token;
}

export async function pcmGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const token = await authenticate();

  const url = new URL(`${PCM_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  let response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
  });

  // Retry once on 401 — token may have expired mid-cache
  if (response.status === 401) {
    cachedToken = null;
    const freshToken = await authenticate();
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${freshToken}` },
    });
  }

  if (!response.ok) {
    throw new Error(`PCM API GET ${path} failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function isPcmConfigured(): boolean {
  return !!(process.env.PCM_API_KEY && process.env.PCM_API_SECRET);
}
