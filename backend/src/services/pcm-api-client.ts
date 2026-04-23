/**
 * PostcardMania API Client — READ-ONLY
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CRITICAL: THIS CLIENT IS READ-ONLY — NO EXCEPTIONS         ║
 * ║                                                              ║
 * ║  Direct instruction from Camilo (CEO):                       ║
 * ║  PostcardMania handles PHYSICAL MAIL. Any accidental write   ║
 * ║  could trigger real mailings, incur real costs, or disrupt   ║
 * ║  active campaigns for paying clients.                        ║
 * ║                                                              ║
 * ║  Only GET requests are allowed (except POST /auth/login).    ║
 * ║  The client throws PcmReadOnlyViolationError if any code     ║
 * ║  attempts POST/PUT/PATCH/DELETE to any non-auth endpoint.    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const PCM_BASE_URL = 'https://v3.pcmintegrations.com';
const TOKEN_CACHE_DURATION_MS = 55 * 60 * 1000; // 55 minutes (tokens expire at 60)
const MAX_REQUESTS_PER_SECOND = 10;

export class PcmReadOnlyViolationError extends Error {
  constructor(method: string, path: string) {
    super(
      `PCM API READ-ONLY VIOLATION: Attempted ${method} ${path}. ` +
      `Only GET requests are allowed. This is a hard rule from leadership — ` +
      `PostcardMania handles physical mail and any write could trigger real mailings.`
    );
    this.name = 'PcmReadOnlyViolationError';
  }
}

interface PcmAuthToken {
  token: string;
  expiresAt: number;
}

interface PcmPaginatedResponse<T> {
  results: T[];
  pagination: {
    page: number;
    perPage: number;
    totalPages: number;
    totalResults: number;
    nextPage: string | null;
    prevPage: string | null;
  };
}

export class PcmApiClient {
  private apiKey: string;
  private apiSecret: string;
  private cachedToken: PcmAuthToken | null = null;
  private requestTimestamps: number[] = [];
  private configured: boolean;

  constructor() {
    this.apiKey = process.env.PCM_API_KEY || '';
    this.apiSecret = process.env.PCM_API_SECRET || '';
    this.configured = !!(this.apiKey && this.apiSecret);

    if (this.configured) {
      console.log('[PCM API] Initialized (READ-ONLY mode)');
    } else {
      console.log('[PCM API] Not configured — missing PCM_API_KEY or PCM_API_SECRET');
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  // ─── Authentication ──────────────────────────────────────────

  private async authenticate(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.token;
    }

    const response = await fetch(`${PCM_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: this.apiKey,
        apiSecret: this.apiSecret,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PCM auth failed (${response.status}): ${text}`);
    }

    const data = await response.json() as { token: string; expires: string };

    this.cachedToken = {
      token: data.token,
      expiresAt: Date.now() + TOKEN_CACHE_DURATION_MS,
    };

    console.log('[PCM API] Authenticated successfully');
    return this.cachedToken.token;
  }

  // ─── Rate Limiter ────────────────────────────────────────────

  private async throttle(): Promise<void> {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(t => now - t < 1000);

    if (this.requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
      const oldestInWindow = this.requestTimestamps[0];
      const waitMs = 1000 - (now - oldestInWindow);
      if (waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    }

    this.requestTimestamps.push(Date.now());
  }

  // ─── Core GET request (the ONLY allowed method) ──────────────

  async get<T = unknown>(path: string, params?: Record<string, string | number>): Promise<T> {
    if (!this.configured) {
      throw new Error('PCM API client is not configured. Check PCM_API_KEY and PCM_API_SECRET.');
    }

    const token = await this.authenticate();
    await this.throttle();

    const url = new URL(`${PCM_BASE_URL}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PCM API GET ${path} failed (${response.status}): ${text}`);
    }

    return response.json() as Promise<T>;
  }

  // ─── Block all write methods ─────────────────────────────────

  async post(_path: string, _body?: unknown): Promise<never> {
    throw new PcmReadOnlyViolationError('POST', _path);
  }

  async put(_path: string, _body?: unknown): Promise<never> {
    throw new PcmReadOnlyViolationError('PUT', _path);
  }

  async patch(_path: string, _body?: unknown): Promise<never> {
    throw new PcmReadOnlyViolationError('PATCH', _path);
  }

  async delete(_path: string): Promise<never> {
    throw new PcmReadOnlyViolationError('DELETE', _path);
  }

  // ─── High-level GET endpoints ────────────────────────────────

  /** Get account balance and inventory */
  async getBalance(): Promise<PcmBalance> {
    return this.get<PcmBalance>('/integration/balance');
  }

  /** Get orders (paginated) — returns { results, pagination } */
  async getOrders(params?: {
    orderedAfter?: string;
    page?: number;
    perPage?: number;
    sort?: string;
  }): Promise<PcmPaginatedResponse<PcmOrder>> {
    return this.get<PcmPaginatedResponse<PcmOrder>>('/order', params as Record<string, string | number>);
  }

  /** Get all orders across all pages */
  async getAllOrders(orderedAfter?: string): Promise<{ orders: PcmOrder[]; totalResults: number }> {
    const allOrders: PcmOrder[] = [];
    let page = 1;
    const perPage = 100;
    let totalResults = 0;

    while (true) {
      const params: Record<string, string | number> = { page, perPage };
      if (orderedAfter) params.orderedAfter = orderedAfter;

      const response = await this.get<PcmPaginatedResponse<PcmOrder>>('/order', params);
      totalResults = response.pagination.totalResults;

      if (!response.results || response.results.length === 0) break;

      allOrders.push(...response.results);

      if (page >= response.pagination.totalPages) break;

      page++;
    }

    return { orders: allOrders, totalResults };
  }

  /** Get a single order by ID */
  async getOrder(orderId: string): Promise<PcmOrder> {
    return this.get<PcmOrder>(`/order/${orderId}`);
  }

  /** Get recipients for an order (paginated) */
  async getOrderRecipients(orderId: string, params?: {
    page?: number;
    perPage?: number;
  }): Promise<PcmPaginatedResponse<PcmRecipient>> {
    return this.get<PcmPaginatedResponse<PcmRecipient>>(
      `/order/${orderId}/recipients`,
      params as Record<string, string | number>
    );
  }

  /** Get batches (paginated) */
  async getBatches(params?: {
    page?: number;
    perPage?: number;
    sort?: string;
  }): Promise<PcmPaginatedResponse<PcmBatch>> {
    return this.get<PcmPaginatedResponse<PcmBatch>>('/batch', params as Record<string, string | number>);
  }

  /** Get a single batch by ID */
  async getBatch(batchId: string): Promise<PcmBatch> {
    return this.get<PcmBatch>(`/batch/${batchId}`);
  }

  /** Get undeliverable recipients (requires at least one filter: batchId, startDate, or endDate) */
  async getUndeliverableRecipients(params: {
    batchId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PcmUndeliverable[]> {
    return this.get<PcmUndeliverable[]>(
      '/recipient/undeliverable',
      params as Record<string, string | number>
    );
  }

  /** Get designs (paginated) */
  async getDesigns(params?: {
    page?: number;
    perPage?: number;
  }): Promise<PcmPaginatedResponse<PcmDesign>> {
    return this.get<PcmPaginatedResponse<PcmDesign>>('/design', params as Record<string, string | number>);
  }

  /** Get suppressed addresses (paginated) */
  async getSuppressedAddresses(params?: {
    page?: number;
    perPage?: number;
  }): Promise<PcmPaginatedResponse<PcmSuppressedAddress>> {
    return this.get<PcmPaginatedResponse<PcmSuppressedAddress>>(
      '/suppression-list',
      params as Record<string, string | number>
    );
  }
}

// ─── PCM API Response Types ────────────────────────────────────

export interface PcmBalance {
  moneyOnAccount: number;
  customInventory?: PcmInventoryItem[];
}

export interface PcmInventoryItem {
  inventoryID: number;
  inventoryType: string;
  name: string;
  remainingStock: number;
  replenishmentThreshold: boolean;
  replenishmentValue: number;
}

export interface PcmOrder {
  orderID: number;
  status: string; // Ordered, Canceled, Mailing, Processing, Undeliverable, Delivered, etc.
  productType: string;
  productionType: string;
  quantity: number;
  amount: number;
  orderedOn: string;
  lastModifiedOn: string;
  scheduledMailDate: string;
  canceledOn?: string;
  designID?: number;
  extRefNbr?: string;
  mailClass?: string;
  batchID?: number;
  recipientCount?: number;
  undeliverableCount?: number;
  pagination?: {
    page: number;
    perPage: number;
    totalPages: number;
    totalResults: number;
  };
}

export interface PcmRecipient {
  recipientID: number;
  orderID: number;
  batchID?: number;
  extRefNbr: string;
  firstName: string;
  lastName: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  status: string;
  isUndeliverable: boolean;
  carrierConfirmed: boolean;
  mailDate?: string;
  deliveryDate?: string;
  impressionDate?: string;
  carrierRoute?: string;
  deliveryPointBarcode?: string;
}

export interface PcmBatch {
  batchID: number;
  status: string; // Pending, Printing, Processing, MailPrep, Delivered, Failed Payment, etc.
  createdOn: string;
  lastModifiedOn: string;
  orders?: number;
  recipients?: number;
  checkedIn?: number;
  totalPages?: number;
  totalResults?: number;
}

export interface PcmUndeliverable {
  batchID: number;
  orderID: number;
  extRefNbr: string;
  failureReason: string;
  date: string;
}

export interface PcmDesign {
  designID: number;
  designType: string;
  name: string;
  description?: string;
  createdOn: string;
  previewFront?: string;
  previewBack?: string;
}

export interface PcmSuppressedAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateAdded: string;
  reason?: string;
}
